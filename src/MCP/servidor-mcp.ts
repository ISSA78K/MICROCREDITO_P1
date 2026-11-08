import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { pool } from "../Adaptadores/postgres/conexion";
import { Dinero } from "../dominio/dinero";
import { PlanAmortizacion } from "../dominio/plan-amortizacion";
import { CalculadoraMora } from "../dominio/calculadora-mora";
import { PoliticaPlana } from "../dominio/politica-mora/politica-plana";
import { CargoCobranza } from "../dominio/cargo-cobranza";
import { SelectorPoliticaMora } from "../dominio/politica-mora/selector-politica-mora";

const servidor = new McpServer({
  name: "microcredito-mcp",
  version: "1.0.0",
});

const fechaSchema = z.string().regex(
  /^\d{4}-\d{2}-\d{2}$/,
  "La fecha de corte debe tener formato YYYY-MM-DD"
);

const estadosActivos = [
  "ACTIVO",
  "VIGENTE",
  "MORA",
  "EN_MORA",
  "REESTRUCTURADO",
];

// Herramienta 1: consultar resumen de cartera
servidor.tool(
  "consultar_resumen_cartera",
  "Consulta el resumen de cartera de microcréditos a una fecha de corte.",
  {
    fechaCorte: fechaSchema,
  },
  async ({ fechaCorte }) => {
    const resultado = await pool.query(
      `SELECT
        COUNT(*) FILTER (
          WHERE estado = ANY($2::text[])
        ) AS creditos_activos,

        COALESCE(
          SUM(saldo_capital_centavos) FILTER (
            WHERE estado = ANY($2::text[])
          ),
          0
        )::text AS cartera_activa_centavos,

        COUNT(*) FILTER (
          WHERE dias_atraso > 0
            AND estado = ANY($2::text[])
        ) AS creditos_en_mora,

        COUNT(*) FILTER (
          WHERE estado IN ('CANCELADO', 'CANCELADA')
        ) AS creditos_cancelados

      FROM creditos
      WHERE fecha_desembolso <= $1`,
      [fechaCorte, estadosActivos]
    );

    const fila = resultado.rows[0];

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            fechaCorte,
            ...fila,
            carteraActiva:
              (Number(fila.cartera_activa_centavos) / 100).toFixed(2),
          }),
        },
      ],
    };
  }
);

// Herramienta 2: consultar un crédito

 // Herramienta 2: consultar un crédito
servidor.tool(
  "consultar_credito",
  "Consulta información detallada de un crédito, su plan de amortización y cuotas en mora a una fecha de corte, explicando la composición de cada cuota.",
  {
    creditoId: z.string().min(1),
    fechaCorte: fechaSchema,
  },
  async ({ creditoId, fechaCorte }) => {
    const resultado = await pool.query(
      `SELECT
        c.id_credito,
        c.id_cliente,
        cl.nombre_completo AS cliente,
        c.fecha_desembolso::text,
        c.capital_centavos::text,
        c.saldo_capital_centavos::text,
        c.plazo_meses,
        c.tna_bps,
        c.politica_mora_id,
        c.estado,
        c.dias_atraso,
        c.reestructurado,
        c.interes_en_suspenso_centavos::text,
        c.cargo_cobranza_generado_centavos::text
      FROM creditos c
      INNER JOIN clientes cl
        ON cl.id_cliente = c.id_cliente
      WHERE c.id_credito = $1
        AND c.fecha_desembolso <= $2`,
      [creditoId, fechaCorte]
    );

    if (resultado.rows.length === 0) {
      return {
        isError: true,
        content: [
          {
            type: "text",
            text: `Crédito inexistente a la fecha de corte ${fechaCorte}.`,
          },
        ],
      };
    }

    const credito = resultado.rows[0];

    const principal = new Dinero(
      BigInt(credito.capital_centavos)
    );

    const tasaMensual =
      Number(credito.tna_bps) / 10000 / 12;

    const numeroCuotas =
      Number(credito.plazo_meses);

    const plan = PlanAmortizacion.generar({
      principal,
      tasaMensual,
      numeroCuotas,
    });

    // Selecciona la política de mora según la fecha
    // de desembolso del crédito.
    const selectorPolitica = new SelectorPoliticaMora();

const politica = selectorPolitica.seleccionar(
  credito.fecha_desembolso
);

    const cuotas = plan.map((cuota) => {
      const fechaDesembolso = new Date(
        `${credito.fecha_desembolso}T00:00:00Z`
      );

      const fechaVencimiento = new Date(
        fechaDesembolso
      );

      fechaVencimiento.setUTCMonth(
        fechaVencimiento.getUTCMonth() +
          cuota.numero
      );

      const fechaVencimientoTexto =
        fechaVencimiento.toISOString().slice(0, 10);

      const mora =
        CalculadoraMora.calcularConPolitica(
          fechaVencimientoTexto,
          fechaCorte,
          cuota.capital,
          politica
        );

      cuota.diasAtraso = mora.diasAtraso;

      const cargoCobranza =
        CargoCobranza.calcularParaCuota(cuota);

      const totalExigible = cuota.cuota
        .sumar(mora.interesMoratorio)
        .sumar(cargoCobranza);

      return {
        numeroCuota: cuota.numero,
        fechaVencimiento: fechaVencimientoTexto,

        capital: cuota.capital.toDecimal(),
        interesCorriente: cuota.interes.toDecimal(),

        cuotaNormal: cuota.cuota.toDecimal(),

        diasAtraso: mora.diasAtraso,
        tramoMora: mora.tramo,

        interesMoratorio:
          mora.interesMoratorio.toDecimal(),

        interesEnSuspenso:
          mora.interesEnSuspenso.toDecimal(),

        cargoCobranza:
          cargoCobranza.toDecimal(),

        totalExigible:
          totalExigible.toDecimal(),

        explicacion:
          `La cuota ${cuota.numero} se compone de ` +
          `Q${cuota.capital.toDecimal()} de capital y ` +
          `Q${cuota.interes.toDecimal()} de interés corriente. ` +
          `La cuota normal es Q${cuota.cuota.toDecimal()}. ` +
          `Tiene ${mora.diasAtraso} días de atraso, ` +
          `clasificación ${mora.tramo}, ` +
          `interés moratorio de Q${mora.interesMoratorio.toDecimal()} ` +
          `y cargo de cobranza de Q${cargoCobranza.toDecimal()}. ` +
          `El total exigible de esta cuota es ` +
          `Q${totalExigible.toDecimal()}.`,
      };
    });

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            fechaCorte,
            credito,
            politicaCobranza: "POL-COBRO-01",
            prelacionPago: [
              "Gastos y comisiones",
              "Interés moratorio",
              "Interés corriente",
              "Capital",
            ],
            cuotas,
          }),
        },
      ],
    };
  }
);

// Herramienta G-6: consultar próximos vencimientos
servidor.tool(
  "consultar_proximos_vencimientos",
  "Consulta la cartera activa completa y devuelve todas las cuotas que vencen en los próximos 7 y 30 días. Debe indicar el número exacto de cuotas, el monto total en quetzales y el detalle completo sin omitir registros ni utilizar puntos suspensivos.",
  {
    fechaCorte: fechaSchema,
  },
  async ({ fechaCorte }) => {
    const resultado = await pool.query(
      `SELECT
        c.id_credito,
        c.id_cliente,
        cl.nombre_completo AS cliente,
        c.fecha_desembolso::text AS fecha_desembolso,
        c.capital_centavos::text AS capital_centavos,
        c.plazo_meses,
        c.tna_bps
      FROM creditos c
      INNER JOIN clientes cl
        ON cl.id_cliente = c.id_cliente
      WHERE c.fecha_desembolso <= $1
        AND c.estado = ANY($2::text[])
      ORDER BY c.id_credito`,
      [fechaCorte, estadosActivos]
    );

    const fechaBase = new Date(`${fechaCorte}T00:00:00Z`);

    const fechaLimite7 = new Date(fechaBase);
    fechaLimite7.setUTCDate(fechaLimite7.getUTCDate() + 7);

    const fechaLimite30 = new Date(fechaBase);
    fechaLimite30.setUTCDate(fechaLimite30.getUTCDate() + 30);

    const fechaTexto7 = fechaLimite7.toISOString().slice(0, 10);
    const fechaTexto30 = fechaLimite30.toISOString().slice(0, 10);

    const vencimientos: any[] = [];

    for (const credito of resultado.rows) {
      const principal = new Dinero(
        BigInt(credito.capital_centavos)
      );

      const tasaMensual =
        Number(credito.tna_bps) / 10000 / 12;

      const numeroCuotas =
        Number(credito.plazo_meses);

      const plan = PlanAmortizacion.generar({
        principal,
        tasaMensual,
        numeroCuotas,
      });

      for (const cuota of plan) {
        const fechaDesembolso = new Date(
          `${credito.fecha_desembolso}T00:00:00Z`
        );

        const fechaVencimiento = new Date(fechaDesembolso);

        fechaVencimiento.setUTCMonth(
          fechaVencimiento.getUTCMonth() + cuota.numero
        );

        const fechaVencimientoTexto =
          fechaVencimiento.toISOString().slice(0, 10);

        if (
          fechaVencimientoTexto > fechaCorte &&
          fechaVencimientoTexto <= fechaTexto30
        ) {
          vencimientos.push({
            creditoId: credito.id_credito,
            cliente: credito.cliente,
            numeroCuota: cuota.numero,
            fechaVencimiento: fechaVencimientoTexto,
            monto: cuota.cuota.toDecimal(),
          });
        }
      }
    }

    const calcularResumen = (dias: number) => {
      const fechaLimite = dias === 7
        ? fechaTexto7
        : fechaTexto30;

      const cuotasFiltradas = vencimientos.filter(
        (cuota) => cuota.fechaVencimiento <= fechaLimite
      );

      const totalCentavos = cuotasFiltradas.reduce(
        (total, cuota) => {
          const monto = Number(cuota.monto);
          return total + Math.round(monto * 100);
        },
        0
      );

      return {
        dias,
        fechaDesde: new Date(
          fechaBase.getTime() + 86400000
        ).toISOString().slice(0, 10),
        fechaHasta: fechaLimite,
        totalCuotas: cuotasFiltradas.length,
        montoTotal: (totalCentavos / 100).toFixed(2),
        cuotas: cuotasFiltradas,
      };
    };

        const resumen7 = calcularResumen(7);
    const resumen30 = calcularResumen(30);

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              fechaCorte,
              totalCreditosConsultados: resultado.rows.length,

              proximos7Dias: {
                fechaDesde: resumen7.fechaDesde,
                fechaHasta: resumen7.fechaHasta,
                totalCuotas: resumen7.totalCuotas,
                montoTotalQ: resumen7.montoTotal,
                detalleCompleto: resumen7.cuotas,
              },

              proximos30Dias: {
                fechaDesde: resumen30.fechaDesde,
                fechaHasta: resumen30.fechaHasta,
                totalCuotas: resumen30.totalCuotas,
                montoTotalQ: resumen30.montoTotal,
                detalleCompleto: resumen30.cuotas,
              },
            },
            null,
            2
          ),
        },
      ],
    };
  }
);

// Herramienta 3: consultar clientes
servidor.tool(
  "consultar_clientes",
  "Consulta clientes registrados hasta una fecha de corte.",
  {
    fechaCorte: fechaSchema,
    nombre: z.string().optional(),
  },
  async ({ fechaCorte, nombre }) => {
    const resultado = await pool.query(
      `SELECT
        id_cliente,
        nombre_completo,
        dpi,
        telefono,
        municipio,
        fecha_alta::text
      FROM clientes
      WHERE fecha_alta <= $1
        AND (
          $2::text IS NULL
          OR nombre_completo ILIKE '%' || $2 || '%'
        )
      ORDER BY nombre_completo ASC
      LIMIT 100`,
      [fechaCorte, nombre ?? null]
    );

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            fechaCorte,
            total: resultado.rows.length,
            clientes: resultado.rows,
          }),
        },
      ],
    };
  }
);

// Herramienta 4: consultar créditos morosos
servidor.tool(
  "consultar_morosos",
  "Consulta los créditos con días de atraso mayores a cero a una fecha de corte.",
  {
    fechaCorte: fechaSchema,
    diasAtrasoMinimos: z.number().int().min(1).optional(),
  },
  async ({ fechaCorte, diasAtrasoMinimos }) => {
    const diasMinimos = diasAtrasoMinimos ?? 1;

    const resultado = await pool.query(
      `SELECT
        c.id_credito,
        c.id_cliente,
        cl.nombre_completo AS cliente,
        c.saldo_capital_centavos::text,
        c.estado,
        c.dias_atraso,
        c.reestructurado,
        c.interes_en_suspenso_centavos::text,
        c.cargo_cobranza_generado_centavos::text
      FROM creditos c
      INNER JOIN clientes cl
        ON cl.id_cliente = c.id_cliente
      WHERE c.fecha_desembolso <= $1
        AND c.dias_atraso >= $2
        AND c.estado = ANY($3::text[])
      ORDER BY c.dias_atraso DESC, c.saldo_capital_centavos DESC`,
      [fechaCorte, diasMinimos, estadosActivos]
    );

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            fechaCorte,
            diasAtrasoMinimos: diasMinimos,
            totalMorosos: resultado.rows.length,
            morosos: resultado.rows,
          }),
        },
      ],
    };
  }
);

// Herramienta 5: consultar cartera en mora
servidor.tool(
  "consultar_cartera_en_mora",
  "Consulta los saldos de créditos en mora y su información de atraso.",
  {
    fechaCorte: fechaSchema,
  },
  async ({ fechaCorte }) => {
    const resultado = await pool.query(
      `SELECT
        COUNT(*) AS total_creditos_en_mora,

        COALESCE(
          SUM(c.saldo_capital_centavos),
          0
        )::text AS saldo_total_en_mora_centavos,

        COALESCE(
          SUM(c.interes_en_suspenso_centavos),
          0
        )::text AS interes_total_en_suspenso_centavos,

        COALESCE(
          SUM(c.cargo_cobranza_generado_centavos),
          0
        )::text AS cobranza_total_centavos,

        MAX(c.dias_atraso) AS maximo_dias_atraso,

        AVG(c.dias_atraso)::numeric(12,2) AS promedio_dias_atraso

      FROM creditos c
            WHERE c.fecha_desembolso <= $1
        AND c.estado = ANY($2::text[])
        AND c.dias_atraso > 0`,
      [
        fechaCorte,
        ["ACTIVO", "VIGENTE", "MORA", "EN_MORA", "REESTRUCTURADO"],
      ]
    );

    const fila = resultado.rows[0];

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            fechaCorte,
            ...fila,
            saldoTotalEnMora:
              (Number(fila.saldo_total_en_mora_centavos) / 100).toFixed(2),
            interesTotalEnSuspenso:
              (Number(fila.interes_total_en_suspenso_centavos) / 100).toFixed(2),
            cobranzaTotal:
              (Number(fila.cobranza_total_centavos) / 100).toFixed(2),
          }),
        },
      ],
    };
  }
);

// Herramienta 6: generar resumen de cierre
servidor.tool(
  "generar_resumen_cierre",
  "Genera un resumen de saldos y créditos agrupados por estado a una fecha de corte.",
  {
    fechaCorte: fechaSchema,
  },
  async ({ fechaCorte }) => {
    const resultado = await pool.query(
      `SELECT
        estado,
        COUNT(*) AS total_creditos,
        COALESCE(
          SUM(saldo_capital_centavos),
          0
        )::text AS saldo_capital_centavos
      FROM creditos
      WHERE fecha_desembolso <= $1
      GROUP BY estado
      ORDER BY estado`,
      [fechaCorte]
    );

    const cierre = resultado.rows.map((fila) => ({
      ...fila,
      saldoCapital:
        (Number(fila.saldo_capital_centavos) / 100).toFixed(2),
    }));

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            fechaCorte,
            fechaGeneracion: new Date().toISOString(),
            cierre,
          }),
        },
      ],
    };
  }
);

async function iniciarMCP(): Promise<void> {
  const transporte = new StdioServerTransport();
  await servidor.connect(transporte);
}

iniciarMCP().catch((error: unknown) => {
  console.error("Error al iniciar el servidor MCP:", error);
  process.exitCode = 1;
});