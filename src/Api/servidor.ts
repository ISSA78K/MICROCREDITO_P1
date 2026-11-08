import express from "express";
import { responderAsistente } from "./asistente-ia";
import { pool } from "../Adaptadores/postgres/conexion";
import { Dinero } from "../dominio/dinero";
import { PlanAmortizacion } from "../dominio/plan-amortizacion";
import { RegistrarPago } from "../Aplicación/registrar-pago";
import { CreditoRepositoryPostgres } from "../Adaptadores/postgres/credito-repository-postgres";
import { PagoRepositoryPostgres } from "../Adaptadores/postgres/pago-repository-postgres";
import { CalculadoraMora } from "../dominio/calculadora-mora";
import { CargoCobranza } from "../dominio/cargo-cobranza";
import { SelectorPoliticaMora } from "../dominio/politica-mora/selector-politica-mora";

const app = express();

app.use(express.json());

const PUERTO = 3000;

const creditoRepository = new CreditoRepositoryPostgres();
const pagoRepository = new PagoRepositoryPostgres();

const registrarPago = new RegistrarPago(creditoRepository, {
  credito: creditoRepository,
  pago: pagoRepository,
});

app.get("/health", (_req, res) => {
  res.status(200).json({
    estado: "correcto",
    sistema: "Sistema de Microcrédito",
    mensaje: "API funcionando correctamente",
  });
});

app.post("/pagos", async (req, res) => {
  try {
    const claveIdempotencia = req.header("Idempotency-Key");
    const { creditoId, monto, saldos } = req.body;

    if (!claveIdempotencia) {
      res.status(400).json({
        error: "Se requiere la cabecera Idempotency-Key",
      });
      return;
    }

    if (
      typeof creditoId !== "string" ||
      typeof monto !== "string" ||
      !saldos ||
      typeof saldos !== "object"
    ) {
      res.status(400).json({
        error: "La solicitud contiene datos incompletos o inválidos",
      });
      return;
    }

    const camposSaldos = [
      "gastos",
      "interesMoratorio",
      "interesCorriente",
      "capital",
    ] as const;

    for (const campo of camposSaldos) {
      if (typeof saldos[campo] !== "string") {
        res.status(400).json({
          error: `El saldo ${campo} debe ser una cadena decimal`,
        });
        return;
      }
    }

    const respuesta = await registrarPago.ejecutar({
      creditoId,
      pagoId: claveIdempotencia,
      monto: Dinero.desdeDecimal(monto),
      saldos: {
        gastos: Dinero.desdeDecimal(saldos.gastos),
        interesMoratorio: Dinero.desdeDecimal(
          saldos.interesMoratorio
        ),
        interesCorriente: Dinero.desdeDecimal(
          saldos.interesCorriente
        ),
        capital: Dinero.desdeDecimal(saldos.capital),
      },
    });

    res.status(respuesta.reproducido ? 200 : 201).json({
      pagoId: respuesta.pagoId,
      creditoId: respuesta.creditoId,
      montoRecibido: respuesta.montoRecibido.toDecimal(),
      aplicacion: {
        gastos: respuesta.aplicacion.gastos.toDecimal(),
        interesMoratorio:
          respuesta.aplicacion.interesMoratorio.toDecimal(),
        interesCorriente:
          respuesta.aplicacion.interesCorriente.toDecimal(),
        capital: respuesta.aplicacion.capital.toDecimal(),
        excedente: respuesta.aplicacion.excedente.toDecimal(),
      },
      reproducido: respuesta.reproducido,
    });
  } catch (error) {
    console.error("Error completo al registrar pago:", error);

    res.status(400).json({
      error:
        error instanceof Error
          ? error.message
          : "Error al registrar el pago",
    });
  }
});

app.get("/pagos", async (_req, res) => {
  try {
    const resultado = await pool.query(`
      SELECT
        p.clave_idempotencia AS "pagoId",
        p.id_credito AS "creditoId",
        cl.nombre_completo AS cliente,
        p.fecha_pago::text AS "fechaPago",
        p.monto_centavos::text AS "montoCentavos",
        p.canal,
        p.respuesta_json -> 'aplicacion' AS aplicacion
      FROM pagos p
      INNER JOIN creditos c
        ON c.id_credito = p.id_credito
      INNER JOIN clientes cl
        ON cl.id_cliente = c.id_cliente
      ORDER BY p.fecha_pago DESC, p.clave_idempotencia DESC
    `);

    res.status(200).json({
      total: resultado.rows.length,
      pagos: resultado.rows.map((fila) => ({
        pagoId: fila.pagoId,
        creditoId: fila.creditoId,
        cliente: fila.cliente,
        fechaPago: fila.fechaPago,
        monto: (Number(fila.montoCentavos) / 100).toFixed(2),
        canal: fila.canal,
        aplicacion: {
          gastos: fila.aplicacion?.gastos ?? "0.00",
          interesMoratorio: fila.aplicacion?.interesMoratorio ?? "0.00",
          interesCorriente: fila.aplicacion?.interesCorriente ?? "0.00",
          capital: fila.aplicacion?.capital ?? "0.00",
          excedente: fila.aplicacion?.excedente ?? "0.00",
        },
      })),
    });
  } catch (error) {
    console.error("Error al consultar historial de pagos:", error);

    res.status(500).json({
      error: "No fue posible consultar el historial de pagos",
    });
  }
});

app.get("/dashboard/resumen", async (_req, res) => {
  try {
    const resumen = await pool.query(`
  SELECT
    COALESCE(
      SUM(saldo_capital_centavos) FILTER (
        WHERE estado IN ('ACTIVO', 'VIGENTE', 'MORA', 'EN_MORA', 'REESTRUCTURADO')
      ),
      0
    )::text AS cartera_activa_centavos,

    COUNT(*) FILTER (
      WHERE estado IN ('ACTIVO', 'VIGENTE', 'MORA', 'EN_MORA', 'REESTRUCTURADO')
    )::text AS creditos_activos,

    COALESCE(
      SUM(capital_centavos) FILTER (
        WHERE estado IN ('ACTIVO', 'VIGENTE', 'MORA', 'EN_MORA', 'REESTRUCTURADO')
      ),
      0
    )::text AS desembolsos_centavos,

    COUNT(*) FILTER (
  WHERE dias_atraso > 0
)::text AS creditos_en_mora,

    COUNT(*) FILTER (
      WHERE estado IN ('CANCELADO', 'CANCELADA')
    )::text AS creditos_cancelados

  FROM creditos
`);

    const pagos = await pool.query(`
      SELECT
        COALESCE(SUM(monto_centavos), 0)::text AS pagos_recibidos_centavos
      FROM pagos
    `);

    const recientes = await pool.query(`
      SELECT
        c.id_credito,
        cl.nombre_completo AS cliente,
        c.capital_centavos::text AS monto_centavos,
        c.estado,
        c.saldo_capital_centavos::text AS saldo_pendiente_centavos
      FROM creditos c
      INNER JOIN clientes cl ON cl.id_cliente = c.id_cliente
      ORDER BY c.fecha_desembolso DESC, c.id_credito DESC
      LIMIT 5
    `);

    const actividad = await pool.query(`
  SELECT
    'DESEMBOLSO' AS tipo,
    c.id_credito::text AS "creditoId",
    cl.nombre_completo AS cliente,
    c.fecha_desembolso::text AS fecha,
    c.capital_centavos::text AS monto_centavos,
    ('DESEMBOLSO-' || c.id_credito::text) AS "movimientoId"
  FROM creditos c
  INNER JOIN clientes cl
    ON cl.id_cliente = c.id_cliente

  UNION ALL

  SELECT
    'PAGO' AS tipo,
    p.id_credito::text AS "creditoId",
    cl.nombre_completo AS cliente,
    p.fecha_pago::text AS fecha,
    p.monto_centavos::text AS monto_centavos,
    p.clave_idempotencia::text AS "movimientoId"
  FROM pagos p
  INNER JOIN creditos c
    ON c.id_credito = p.id_credito
  INNER JOIN clientes cl
    ON cl.id_cliente = c.id_cliente

  ORDER BY fecha DESC
  LIMIT 10
`);

    const datos = resumen.rows[0];
    const pagosDatos = pagos.rows[0];

    res.status(200).json({
  carteraActiva: (Number(datos.cartera_activa_centavos) / 100).toFixed(2),
  creditosActivos: Number(datos.creditos_activos),
  desembolsos: (Number(datos.desembolsos_centavos) / 100).toFixed(2),
  pagosRecibidos: (Number(pagosDatos.pagos_recibidos_centavos) / 100).toFixed(2),
  creditosEnMora: Number(datos.creditos_en_mora),
  creditosCancelados: Number(datos.creditos_cancelados),

  creditosRecientes: recientes.rows.map((fila) => ({
    creditoId: fila.id_credito,
    cliente: fila.cliente,
    monto: (Number(fila.monto_centavos) / 100).toFixed(2),
    estado: fila.estado,
    saldoPendiente: (Number(fila.saldo_pendiente_centavos) / 100).toFixed(2),
  })),

  actividadReciente: actividad.rows.map((fila) => ({
    movimientoId: fila.movimientoId,
    tipo: fila.tipo,
    creditoId: fila.creditoId,
    cliente: fila.cliente,
    fecha: fila.fecha,
    monto: (Number(fila.monto_centavos) / 100).toFixed(2),
  })),
});
    
  } catch (error) {
    console.error("Error al consultar resumen del dashboard:", error);

    res.status(500).json({
      error: "No fue posible consultar el resumen del dashboard",
    });
  }
});
app.get("/clientes", async (_req, res) => {
  try {
    const resultado = await pool.query(`
      SELECT
        id_cliente,
        nombre_completo,
        dpi,
        telefono,
        municipio,
        fecha_alta::text AS fecha_alta
      FROM clientes
      ORDER BY nombre_completo ASC
    `);

    res.status(200).json({
      total: resultado.rows.length,
      clientes: resultado.rows,
    });
  } catch (error) {
    console.error("Error al consultar clientes:", error);

    res.status(500).json({
      error: "No fue posible consultar los clientes",
    });
  }
});

app.get("/asesores", async (_req, res) => {
  try {
    const resultado = await pool.query(`
      SELECT id_asesor, nombre_completo
      FROM asesores
      ORDER BY nombre_completo ASC
    `);

    res.status(200).json({
      total: resultado.rows.length,
      asesores: resultado.rows,
    });
  } catch (error) {
    console.error("Error al consultar asesores:", error);

    res.status(500).json({
      error: "No fue posible consultar los asesores",
    });
  }
});
app.post("/clientes", async (req, res) => {
  try {
    const { nombre_completo, dpi, telefono, municipio } = req.body;

    if (
      typeof nombre_completo !== "string" ||
      typeof dpi !== "string" ||
      nombre_completo.trim() === "" ||
      dpi.trim() === ""
    ) {
      res.status(400).json({
        error: "El nombre completo y el DPI son obligatorios",
      });
      return;
    }

    const nombre = nombre_completo.trim();
    const dpiLimpio = dpi.trim();
    const telefonoLimpio =
      typeof telefono === "string" && telefono.trim() !== ""
        ? telefono.trim()
        : null;
    const municipioLimpio =
      typeof municipio === "string" && municipio.trim() !== ""
        ? municipio.trim()
        : null;

    const dpiExistente = await pool.query(
      "SELECT id_cliente FROM clientes WHERE dpi = $1",
      [dpiLimpio]
    );

    if (dpiExistente.rows.length > 0) {
      res.status(409).json({
        error: "Ya existe un cliente registrado con ese DPI",
      });
      return;
    }

    const codigoResultado = await pool.query(`
      SELECT
        COALESCE(
          MAX(SUBSTRING(id_cliente FROM 4)::INTEGER),
          0
        ) + 1 AS siguiente
      FROM clientes
      WHERE id_cliente ~ '^CL-[0-9]+$'
    `);

    const siguiente = Number(codigoResultado.rows[0].siguiente);
    const idCliente = `CL-${String(siguiente).padStart(4, "0")}`;

    const resultado = await pool.query(
      `INSERT INTO clientes (
        id_cliente,
        nombre_completo,
        dpi,
        telefono,
        municipio,
        fecha_alta
      )
      VALUES ($1, $2, $3, $4, $5, CURRENT_DATE)
      RETURNING
        id_cliente,
        nombre_completo,
        dpi,
        telefono,
        municipio,
        fecha_alta::text AS fecha_alta`,
      [
        idCliente,
        nombre,
        dpiLimpio,
        telefonoLimpio,
        municipioLimpio,
      ]
    );

    res.status(201).json({
      mensaje: "Cliente registrado correctamente",
      cliente: resultado.rows[0],
    });
  } catch (error) {
    console.error("Error al registrar cliente:", error);

    res.status(500).json({
      error: "No fue posible registrar el cliente",
    });
  }
});

app.post("/chat", async (req, res) => {
  try {
    const mensaje = req.body?.mensaje;
    const sessionId = req.body?.sessionId;

    console.log("SESSION ID RECIBIDO:", sessionId);

    if (typeof mensaje !== "string" || mensaje.trim().length === 0) {
      res.status(400).json({
        error: "Debes proporcionar un mensaje válido",
      });
      return;
    }

    const respuesta = await responderAsistente(
      mensaje.trim(),
      sessionId
    );

    res.json({
      respuesta,
    });
  } catch (error) {
    console.error("Error en el asistente IA:", error);
    res.status(500).json({
      error: "No fue posible obtener una respuesta del asistente",
    });
  }
});

app.get("/creditos", async (_req, res) => {
  try {
    const resultado = await pool.query(`
      SELECT
        c.id_credito,
        c.id_cliente,
        cl.nombre_completo AS cliente,
        c.fecha_desembolso::text AS fecha_desembolso,
        c.capital_centavos::text AS capital_centavos,
        c.saldo_capital_centavos::text AS saldo_capital_centavos,
        c.plazo_meses,
        c.tna_bps,
        c.estado,
        c.dias_atraso
      FROM creditos c
      INNER JOIN clientes cl
        ON cl.id_cliente = c.id_cliente
      ORDER BY c.fecha_desembolso DESC, c.id_credito DESC
    `);

    res.status(200).json({
      total: resultado.rows.length,
      creditos: resultado.rows.map((fila) => ({
        creditoId: fila.id_credito,
        clienteId: fila.id_cliente,
        cliente: fila.cliente,
        fechaDesembolso: fila.fecha_desembolso,
        capital: (Number(fila.capital_centavos) / 100).toFixed(2),
        saldoCapital: (Number(fila.saldo_capital_centavos) / 100).toFixed(2),
        plazoMeses: Number(fila.plazo_meses),
        tasaAnual: (Number(fila.tna_bps) / 100).toFixed(2),
        estado: fila.estado,
        diasAtraso: Number(fila.dias_atraso),
      })),
    });
  } catch (error) {
    console.error("Error al consultar créditos:", error);

    res.status(500).json({
      error: "No fue posible consultar los créditos",
    });
  }
});

app.get("/mora", async (_req, res) => {
  try {
    const resultado = await pool.query(`
      SELECT
        c.id_credito,
        c.id_cliente,
        cl.nombre_completo AS cliente,
        c.fecha_desembolso::text AS fecha_desembolso,
        c.saldo_capital_centavos::text AS saldo_capital_centavos,
        c.estado,
        c.dias_atraso,
        c.interes_en_suspenso_centavos::text AS interes_en_suspenso_centavos,
        c.cargo_cobranza_generado_centavos::text AS cargo_cobranza_generado_centavos
      FROM creditos c
      INNER JOIN clientes cl
        ON cl.id_cliente = c.id_cliente
      WHERE c.dias_atraso > 0
      ORDER BY c.dias_atraso DESC, c.id_credito DESC
    `);

    const selectorPolitica = new SelectorPoliticaMora();

    const creditosEnMora = resultado.rows.map((fila) => {
      const diasAtraso = Number(fila.dias_atraso);

      const capitalEnMora = new Dinero(
        BigInt(fila.saldo_capital_centavos)
      );

      const politica = selectorPolitica.seleccionar(
        fila.fecha_desembolso
      );

      const diasInteresMoratorio = Math.min(
        diasAtraso,
        90
      );

      const diasInteresTotal = Math.min(
        diasAtraso,
        120
      );

      const interesMoratorio = politica.calcularInteres(
        capitalEnMora,
        diasInteresMoratorio
      );

      const interesTotal = politica.calcularInteres(
        capitalEnMora,
        diasInteresTotal
      );

      const interesEnSuspenso =
        interesTotal.centavos >= interesMoratorio.centavos
          ? interesTotal.restar(interesMoratorio)
          : Dinero.cero();

      const cargoYaGenerado =
        BigInt(fila.cargo_cobranza_generado_centavos) > 0n;

      const cargoCobranza = CargoCobranza.calcular(
        diasAtraso,
        cargoYaGenerado
      );

      return {
        creditoId: fila.id_credito,
        clienteId: fila.id_cliente,
        cliente: fila.cliente,
        fechaDesembolso: fila.fecha_desembolso,
        saldoCapital: capitalEnMora.toDecimal(),
        estado: fila.estado,
        diasAtraso,
        tramo: CalculadoraMora.determinarTramo(diasAtraso),
        politicaMora: politica.id,
        interesMoratorio: interesMoratorio.toDecimal(),
        interesEnSuspenso: interesEnSuspenso.toDecimal(),
        cargoCobranza: cargoCobranza.toDecimal(),
      };
    });

    res.status(200).json({
      total: creditosEnMora.length,
      creditos: creditosEnMora,
    });
  } catch (error) {
    console.error("Error al consultar la gestión de mora:", error);

    res.status(500).json({
      error: "No fue posible consultar la gestión de mora",
    });
  }
});

app.get("/solicitudes", async (_req, res) => {
  try {
    const resultado = await pool.query(`
      SELECT
        s.id_solicitud,
        s.id_cliente,
        cl.nombre_completo AS cliente,
        s.id_asesor,
        a.nombre_completo AS asesor,
        s.fecha_solicitud::text AS fecha_solicitud,
        s.monto_solicitado_centavos::text AS monto_centavos,
        s.plazo_meses,
        s.destino_credito,
        s.observaciones,
        s.estado
      FROM solicitudes s
      INNER JOIN clientes cl
        ON cl.id_cliente = s.id_cliente
      LEFT JOIN asesores a
        ON a.id_asesor = s.id_asesor
      ORDER BY s.fecha_solicitud DESC, s.id_solicitud DESC
    `);

    res.status(200).json({
      total: resultado.rows.length,
      solicitudes: resultado.rows.map((fila) => ({
        solicitudId: fila.id_solicitud,
        clienteId: fila.id_cliente,
        cliente: fila.cliente,
        asesorId: fila.id_asesor,
        asesor: fila.asesor,
        fechaSolicitud: fila.fecha_solicitud,
        montoSolicitado: (Number(fila.monto_centavos) / 100).toFixed(2),
        plazoMeses: Number(fila.plazo_meses),
        destinoCredito: fila.destino_credito,
        observaciones: fila.observaciones,
        estado: fila.estado,
      })),
    });
  } catch (error) {
    console.error("Error al consultar solicitudes:", error);

    res.status(500).json({
      error: "No fue posible consultar las solicitudes de crédito",
    });
  }
});

app.post("/solicitudes", async (req, res) => {
  try {
    const {
      id_cliente,
      id_asesor,
      monto_solicitado,
      plazo_meses,
      destino_credito,
      observaciones,
    } = req.body;

    if (
      typeof id_cliente !== "string" ||
      id_cliente.trim() === "" ||
      typeof monto_solicitado !== "string" && typeof monto_solicitado !== "number" ||
      !Number.isFinite(Number(monto_solicitado)) ||
      Number(monto_solicitado) <= 0 ||
      !Number.isInteger(Number(plazo_meses)) ||
      Number(plazo_meses) <= 0 ||
      typeof destino_credito !== "string" ||
      destino_credito.trim() === ""
    ) {
      res.status(400).json({
        error: "Debes completar el cliente, monto, plazo y destino del crédito",
      });
      return;
    }

    const clienteId = id_cliente.trim();
    const asesorId =
      typeof id_asesor === "string" && id_asesor.trim() !== ""
        ? id_asesor.trim()
        : null;
    const montoCentavos = Math.round(Number(monto_solicitado) * 100);
    const plazo = Number(plazo_meses);
    const destino = destino_credito.trim();
    const observacionesLimpias =
      typeof observaciones === "string" && observaciones.trim() !== ""
        ? observaciones.trim()
        : null;

    const clienteExistente = await pool.query(
      "SELECT id_cliente FROM clientes WHERE id_cliente = $1",
      [clienteId]
    );

    if (clienteExistente.rows.length === 0) {
      res.status(404).json({
        error: "El cliente seleccionado no existe",
      });
      return;
    }

    if (asesorId !== null) {
      const asesorExistente = await pool.query(
        "SELECT id_asesor FROM asesores WHERE id_asesor = $1",
        [asesorId]
      );

      if (asesorExistente.rows.length === 0) {
        res.status(404).json({
          error: "El asesor seleccionado no existe",
        });
        return;
      }
    }

    const codigoResultado = await pool.query(`
      SELECT
        COALESCE(
          MAX(SUBSTRING(id_solicitud FROM 5)::INTEGER),
          0
        ) + 1 AS siguiente
      FROM solicitudes
      WHERE id_solicitud ~ '^SOL-[0-9]+$'
    `);

    const siguiente = Number(codigoResultado.rows[0].siguiente);
    const idSolicitud = `SOL-${String(siguiente).padStart(4, "0")}`;

    const resultado = await pool.query(
      `INSERT INTO solicitudes (
        id_solicitud,
        id_cliente,
        id_asesor,
        fecha_solicitud,
        monto_solicitado_centavos,
        plazo_meses,
        destino_credito,
        observaciones,
        estado
      )
      VALUES ($1, $2, $3, CURRENT_DATE, $4, $5, $6, $7, 'PENDIENTE')
      RETURNING
        id_solicitud,
        id_cliente,
        id_asesor,
        fecha_solicitud::text AS fecha_solicitud,
        monto_solicitado_centavos::text AS monto_centavos,
        plazo_meses,
        destino_credito,
        observaciones,
        estado`,
      [
        idSolicitud,
        clienteId,
        asesorId,
        montoCentavos,
        plazo,
        destino,
        observacionesLimpias,
      ]
    );

    res.status(201).json({
      mensaje: "Solicitud de crédito registrada correctamente",
      solicitud: {
        solicitudId: resultado.rows[0].id_solicitud,
        clienteId: resultado.rows[0].id_cliente,
        asesorId: resultado.rows[0].id_asesor,
        fechaSolicitud: resultado.rows[0].fecha_solicitud,
        montoSolicitado: (Number(resultado.rows[0].monto_centavos) / 100).toFixed(2),
        plazoMeses: Number(resultado.rows[0].plazo_meses),
        destinoCredito: resultado.rows[0].destino_credito,
        observaciones: resultado.rows[0].observaciones,
        estado: resultado.rows[0].estado,
      },
    });
  } catch (error) {
    console.error("Error al registrar solicitud:", error);

    res.status(500).json({
      error: "No fue posible registrar la solicitud de crédito",
    });
  }
});

app.patch("/solicitudes/:id/estado", async (req, res) => {
  const conexion = await pool.connect();

  try {
    const idSolicitud = req.params.id;
    const { estado } = req.body;

    if (estado !== "APROBADA" && estado !== "RECHAZADA") {
      res.status(400).json({
        error: "El estado debe ser APROBADA o RECHAZADA",
      });
      return;
    }

    await conexion.query("BEGIN");

    const resultado = await conexion.query(
      `SELECT *
       FROM solicitudes
       WHERE id_solicitud = $1
         AND estado IN ('PENDIENTE', 'EN_REVISION')
       FOR UPDATE`,
      [idSolicitud]
    );

    if (resultado.rows.length === 0) {
      await conexion.query("ROLLBACK");

      res.status(404).json({
        error: "Solicitud no encontrada o ya procesada",
      });
      return;
    }

    const solicitud = resultado.rows[0];

    if (estado === "APROBADA") {
      const ultimoCredito = await conexion.query(
        `SELECT id_credito
         FROM creditos
         WHERE id_credito LIKE 'CV-2026-%'
         ORDER BY CAST(SUBSTRING(id_credito FROM 9) AS INTEGER) DESC
         LIMIT 1`
      );

      const numero = ultimoCredito.rows.length > 0
        ? parseInt(ultimoCredito.rows[0].id_credito.substring(8), 10) + 1
        : 1;

      const idCredito = `CV-2026-${String(numero).padStart(4, "0")}`;

      await conexion.query(
        `INSERT INTO creditos (
          id_credito,
          id_cliente,
          id_asesor,
          fecha_desembolso,
          capital_centavos,
          saldo_capital_centavos,
          plazo_meses,
          tna_bps,
          reestructurado,
          estado,
          politica_mora_id
        )
        VALUES ($1, $2, $3, CURRENT_DATE, $4, $4, $5, 3600, FALSE, 'ACTIVO', 'POL-2026-10')`,
        [
          idCredito,
          solicitud.id_cliente,
          solicitud.id_asesor,
          solicitud.monto_solicitado_centavos,
          solicitud.plazo_meses,
        ]
      );
    }

    await conexion.query(
      `UPDATE solicitudes
       SET estado = $1
       WHERE id_solicitud = $2`,
      [estado, idSolicitud]
    );

    await conexion.query("COMMIT");

    res.status(200).json({
      mensaje: `Solicitud ${estado.toLowerCase()} correctamente`,
      solicitud: {
        solicitudId: idSolicitud,
        estado,
      },
    });
  } catch (error) {
    await conexion.query("ROLLBACK");

    console.error("Error al actualizar solicitud:", error);

    res.status(500).json({
      error: "No fue posible actualizar el estado de la solicitud",
    });
  } finally {
    conexion.release();
  }
});

app.get(
  "/creditos/:id/plan-amortizacion",
  async (req, res) => {
    try {
      const creditoId = req.params.id;

      const resultado = await pool.query(
        `
        SELECT
          id_credito,
          capital_centavos::text AS capital_centavos,
          plazo_meses,
          tna_bps
        FROM creditos
        WHERE id_credito = $1
        `,
        [creditoId]
      );

      const credito = resultado.rows[0];

      if (!credito) {
        res.status(404).json({
          error: "Crédito no encontrado",
        });
        return;
      }

      const principal = new Dinero(
        BigInt(credito.capital_centavos)
      );

      const tasaMensual =
        Number(credito.tna_bps) / 10000 / 12;

      const numeroCuotas = Number(
        credito.plazo_meses
      );

      const cuotas = PlanAmortizacion.generar({
        principal,
        tasaMensual,
        numeroCuotas,
      });

      res.status(200).json({
        creditoId: credito.id_credito,
        totalCuotas: cuotas.length,
        cuotas: cuotas.map((cuota) => ({
          numero: cuota.numero,
          capital: cuota.capital.toDecimal(),
          interes: cuota.interes.toDecimal(),
          cuota: cuota.cuota.toDecimal(),
          saldo: cuota.saldo.toDecimal(),
          diasAtraso: cuota.diasAtraso,
          cargoCobranzaGenerado:
            cuota.cargoCobranzaGenerado,
        })),
      });
    } catch (error) {
      console.error(
        "Error al generar plan de amortización:",
        error
      );

      res.status(500).json({
        error: "No fue posible generar el plan de amortización",
      });
    }
  }
);

app.listen(PUERTO, () => {
  console.log(`API iniciada en http://localhost:${PUERTO}`);
});