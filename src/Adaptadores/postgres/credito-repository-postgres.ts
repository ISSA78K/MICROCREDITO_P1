import { pool } from "./conexion";
import type { PoolClient } from "pg";

import {
  Credito,
  CreditoRepository,
} from "../../Puertos/credito-repository";

import { Dinero } from "../../dominio/dinero";
import { EstadoCredito } from "../../dominio/estado-credito";

interface CreditoPostgres {
  id_credito: string;
  id_cliente: string;
  saldo_capital_centavos: string;
  estado: string;
  fecha_desembolso: string;
  politica_mora_id: string | null;
  interes_en_suspenso_centavos: string;
  dias_atraso: number;
  cargo_cobranza_generado_centavos: string;
}

function convertirEstado(estado: string): EstadoCredito {
  const equivalencias: Record<string, EstadoCredito> = {
    ACTIVO: "vigente",
    VIGENTE: "vigente",
    MORA: "en_mora",
    EN_MORA: "en_mora",
    REESTRUCTURADO: "reestructurado",
    CANCELADO: "cancelado",
    INCOBRABLE: "incobrable",
    APROBADO: "aprobado",
    DESEMBOLSADO: "desembolsado",
    SOLICITADO: "solicitado",
    RECHAZADO: "rechazado",
    ANULADO: "anulado",
  };

  const resultado = equivalencias[estado.toUpperCase()];

  if (!resultado) {
    throw new Error(
      `Estado de crédito desconocido en PostgreSQL: ${estado}`
    );
  }

  return resultado;
}

function convertirCredito(fila: CreditoPostgres): Credito {
  return {
    creditoId: fila.id_credito,
    clienteId: fila.id_cliente,
    saldoCapital: new Dinero(
      BigInt(fila.saldo_capital_centavos)
    ),
    estado: convertirEstado(fila.estado),
    fechaDesembolso: fila.fecha_desembolso,
    politicaMoraId: fila.politica_mora_id ?? "",
    interesEnSuspenso: new Dinero(
      BigInt(fila.interes_en_suspenso_centavos)
    ),
    diasAtraso: fila.dias_atraso,
    cargoCobranzaGenerado:
      BigInt(fila.cargo_cobranza_generado_centavos) > 0n,
  };
}

export class CreditoRepositoryPostgres
  implements CreditoRepository
{
  async buscarPorId(
    creditoId: string
  ): Promise<Credito | undefined> {
    const resultado = await pool.query<CreditoPostgres>(
      `SELECT
        id_credito,
        id_cliente,
        saldo_capital_centavos,
        estado,
        fecha_desembolso,
        politica_mora_id,
        interes_en_suspenso_centavos,
        dias_atraso,
        cargo_cobranza_generado_centavos
      FROM creditos
      WHERE id_credito = $1`,
      [creditoId]
    );

    const fila = resultado.rows[0];

    if (!fila) {
      return undefined;
    }

    return convertirCredito(fila);
  }

  async listarTodos(): Promise<Credito[]> {
    const resultado = await pool.query<CreditoPostgres>(
      `SELECT
        id_credito,
        id_cliente,
        saldo_capital_centavos,
        estado,
        fecha_desembolso,
        politica_mora_id,
        interes_en_suspenso_centavos,
        dias_atraso,
        cargo_cobranza_generado_centavos
      FROM creditos
      ORDER BY id_credito`
    );

    return resultado.rows.map(convertirCredito);
  }

  async guardar(credito: Credito): Promise<void> {
    await pool.query(
      `UPDATE creditos
      SET
        saldo_capital_centavos = $1,
        estado = $2,
        interes_en_suspenso_centavos = $3,
        dias_atraso = $4,
        cargo_cobranza_generado_centavos = $5
      WHERE id_credito = $6`,
      [
        credito.saldoCapital.centavos.toString(),
        credito.estado.toUpperCase(),
        credito.interesEnSuspenso.centavos.toString(),
        credito.diasAtraso ?? 0,
        credito.cargoCobranzaGenerado ? "2500" : "0",
        credito.creditoId,
      ]
    );
  }

  async buscarPorIdEnTransaccion(
    creditoId: string,
    cliente: PoolClient
  ): Promise<Credito | undefined> {
    const resultado = await cliente.query<CreditoPostgres>(
      `SELECT
        id_credito,
        id_cliente,
        saldo_capital_centavos,
        estado,
        fecha_desembolso,
        politica_mora_id,
        interes_en_suspenso_centavos,
        dias_atraso,
        cargo_cobranza_generado_centavos
      FROM creditos
      WHERE id_credito = $1
      FOR UPDATE`,
      [creditoId]
    );

    const fila = resultado.rows[0];

    return fila ? convertirCredito(fila) : undefined;
  }

  async guardarEnTransaccion(
    credito: Credito,
    cliente: PoolClient
  ): Promise<void> {
    await cliente.query(
      `UPDATE creditos
      SET
        saldo_capital_centavos = $1,
        estado = $2,
        interes_en_suspenso_centavos = $3,
        dias_atraso = $4,
        cargo_cobranza_generado_centavos = $5
      WHERE id_credito = $6`,
      [
        credito.saldoCapital.centavos.toString(),
        credito.estado.toUpperCase(),
        credito.interesEnSuspenso.centavos.toString(),
        credito.diasAtraso ?? 0,
        credito.cargoCobranzaGenerado ? "2500" : "0",
        credito.creditoId,
      ]
    );
  }
}