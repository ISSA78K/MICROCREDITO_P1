import "dotenv/config";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { parse } from "csv-parse/sync";
import { pool } from "./conexion.js";

type Evento = {
  seq: number;
  tipo: "CLIENTE" | "DESEMBOLSO" | "PAGO";
  [key: string]: string | number | boolean;
};

async function cargarDatos(): Promise<void> {
  const directorio = resolve(
    process.env.CV_DATA_DIR ?? "./datos-proyecto-final/datos-proyecto-final"
  );

  const archivoEventos = resolve(directorio, "eventos.jsonl");
  const archivoHash = resolve(directorio, "eventos.sha256");
  const archivoAsesores = resolve(directorio, "asesores.csv");
  const archivoPoliticas = resolve(directorio, "politicas.json");

  const contenidoEventos = await readFile(archivoEventos, "utf8");
  const hashEsperado = (await readFile(archivoHash, "utf8")).match(/[a-fA-F0-9]{64}/)?.[0];

  if (!hashEsperado) {
    throw new Error("No se encontró un SHA-256 válido en eventos.sha256");
  }

  const hashCalculado = createHash("sha256")
    .update(contenidoEventos, "utf8")
    .digest("hex");

  if (hashCalculado.toLowerCase() !== hashEsperado.toLowerCase()) {
    throw new Error("ERROR: SHA-256 de eventos.jsonl no coincide.");
  }

  const eventos: Evento[] = contenidoEventos
    .split(/\r?\n/)
    .filter((linea) => linea.trim().length > 0)
    .map((linea) => JSON.parse(linea) as Evento)
    .sort((a, b) => a.seq - b.seq);

  const asesores = parse(await readFile(archivoAsesores, "utf8"), {
    columns: true,
    skip_empty_lines: true,
    bom: true,
  }) as Array<{ id_asesor: string; nombre_completo: string }>;

  const politicas = JSON.parse(await readFile(archivoPoliticas, "utf8")) as {
    politicas_mora: Record<string, unknown>;
  };

  const cliente = await pool.connect();

  try {
    await cliente.query("BEGIN");

    for (const asesor of asesores) {
      await cliente.query(
        `INSERT INTO asesores (id_asesor, nombre_completo)
         VALUES ($1, $2)
         ON CONFLICT (id_asesor) DO NOTHING`,
        [asesor.id_asesor, asesor.nombre_completo]
      );
    }

    for (const [idPolitica, datos] of Object.entries(politicas.politicas_mora)) {
      await cliente.query(
        `INSERT INTO politicas (id_politica, datos)
         VALUES ($1, $2::jsonb)
         ON CONFLICT (id_politica) DO NOTHING`,
        [idPolitica, JSON.stringify(datos)]
      );
    }

    for (const evento of eventos) {
      if (evento.tipo === "CLIENTE") {
        await cliente.query(
          `INSERT INTO clientes
            (id_cliente, nombre_completo, dpi, telefono, municipio, fecha_alta)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT (id_cliente) DO NOTHING`,
          [
            evento.id_cliente,
            evento.nombre_completo,
            evento.dpi,
            evento.telefono,
            evento.municipio,
            evento.fecha_alta,
          ]
        );
      } else if (evento.tipo === "DESEMBOLSO") {
        const fecha = String(evento.fecha);
        const politicaMoraId =
          fecha >= "2026-10-01" ? "POL-2026-10" : "POL-2024-01";

        await cliente.query(
          `INSERT INTO creditos
            (id_credito, id_cliente, id_asesor, fecha_desembolso,
             capital_centavos, saldo_capital_centavos, plazo_meses, tna_bps,
             reestructurado, estado, politica_mora_id)
           VALUES ($1, $2, $3, $4, $5, $5, $6, $7, $8, 'ACTIVO', $9)
           ON CONFLICT (id_credito) DO NOTHING`,
          [
            evento.id_credito,
            evento.id_cliente,
            evento.id_asesor,
            evento.fecha,
            evento.capital_centavos,
            evento.plazo_meses,
            evento.tna_bps,
            evento.reestructurado,
            politicaMoraId,
          ]
        );
      } else if (evento.tipo === "PAGO") {
        await cliente.query(
          `INSERT INTO pagos
            (clave_idempotencia, id_credito, fecha_pago, monto_centavos, canal)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (clave_idempotencia) DO NOTHING`,
          [
            evento.clave_idempotencia,
            evento.id_credito,
            evento.fecha,
            evento.monto_centavos,
            evento.canal,
          ]
        );
      }

      await cliente.query(
        `INSERT INTO eventos (seq, tipo, datos)
         VALUES ($1, $2, $3::jsonb)
         ON CONFLICT (seq) DO NOTHING`,
        [evento.seq, evento.tipo, JSON.stringify(evento)]
      );
    }

    await cliente.query("COMMIT");

    console.log("Carga canónica completada correctamente.");
    console.log(`SHA-256 verificado: ${hashCalculado}`);
    console.log(`Eventos procesados: ${eventos.length}`);
    console.log(`Asesores procesados: ${asesores.length}`);
  } catch (error) {
    await cliente.query("ROLLBACK");
    throw error;
  } finally {
    cliente.release();
    await pool.end();
  }
}

cargarDatos().catch((error: unknown) => {
  console.error("Error durante la carga:", error);
  process.exitCode = 1;
});