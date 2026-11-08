import { describe, it, expect, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
  herramientas: new Map<string, any>(),
  query: vi.fn(),
  connect: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@modelcontextprotocol/sdk/server/mcp.js", () => ({
  McpServer: class {
    tool(
      nombre: string,
      descripcion: string,
      esquema: any,
      handler: any
    ) {
      mocks.herramientas.set(nombre, {
        descripcion,
        esquema,
        handler,
      });
    }

    connect = mocks.connect;
  },
}));

vi.mock("@modelcontextprotocol/sdk/server/stdio.js", () => ({
  StdioServerTransport: class {},
}));

vi.mock("../src/Adaptadores/postgres/conexion", () => ({
  pool: {
    query: mocks.query,
  },
}));

vi.mock("../src/dominio/dinero", () => ({
  Dinero: class {},
}));

vi.mock("../src/dominio/plan-amortizacion", () => ({
  PlanAmortizacion: {
    generar: vi.fn().mockReturnValue([]),
  },
}));

vi.mock("../src/dominio/calculadora-mora", () => ({
  CalculadoraMora: {
    calcularConPolitica: vi.fn(),
  },
}));

vi.mock("../src/dominio/politica-mora/politica-plana", () => ({
  PoliticaPlana: class {},
}));

vi.mock("../src/dominio/cargo-cobranza", () => ({
  CargoCobranza: {
    calcularParaCuota: vi.fn(),
  },
}));

describe("Servidor MCP de microcréditos", () => {

beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
  mocks.herramientas.clear();

    mocks.connect.mockResolvedValue(undefined);
  });

  it("registra las siete herramientas MCP", async () => {
    await import("../src/MCP/servidor-mcp");

    expect(mocks.herramientas.size).toBe(7);

    expect([...mocks.herramientas.keys()]).toEqual(
      expect.arrayContaining([
        "consultar_resumen_cartera",
        "consultar_credito",
        "consultar_proximos_vencimientos",
        "consultar_clientes",
        "consultar_morosos",
        "consultar_cartera_en_mora",
        "generar_resumen_cierre",
      ])
    );
  });

  it("conecta el servidor MCP mediante STDIO", async () => {
    await import("../src/MCP/servidor-mcp");

    expect(mocks.connect).toHaveBeenCalledTimes(1);
  });

  it("consulta clientes y devuelve los resultados", async () => {
    await import("../src/MCP/servidor-mcp");

    mocks.query.mockResolvedValue({
      rows: [
        {
          id_cliente: "1",
          nombre_completo: "Juan Pérez",
          dpi: "123456789",
          telefono: "55555555",
          municipio: "Guatemala",
          fecha_alta: "2026-01-01",
        },
      ],
    });

    const herramienta =
      mocks.herramientas.get("consultar_clientes");

    const resultado = await herramienta.handler({
      fechaCorte: "2026-01-31",
      nombre: "Juan",
    });

    const respuesta = JSON.parse(resultado.content[0].text);

    expect(respuesta.fechaCorte).toBe("2026-01-31");
    expect(respuesta.total).toBe(1);
    expect(respuesta.clientes[0].nombre_completo).toBe("Juan Pérez");
    expect(mocks.query).toHaveBeenCalledTimes(1);
  });

  it("consulta los créditos morosos", async () => {
    await import("../src/MCP/servidor-mcp");

    mocks.query.mockResolvedValue({
      rows: [
        {
          id_credito: "C001",
          id_cliente: "1",
          cliente: "Juan Pérez",
          saldo_capital_centavos: "50000",
          estado: "MORA",
          dias_atraso: 15,
          reestructurado: false,
          interes_en_suspenso_centavos: "0",
          cargo_cobranza_generado_centavos: "1000",
        },
      ],
    });

    const herramienta =
      mocks.herramientas.get("consultar_morosos");

    const resultado = await herramienta.handler({
      fechaCorte: "2026-01-31",
    });

    const respuesta = JSON.parse(resultado.content[0].text);

    expect(respuesta.totalMorosos).toBe(1);
    expect(respuesta.diasAtrasoMinimos).toBe(1);
    expect(respuesta.morosos[0].dias_atraso).toBe(15);
  });

  it("genera el resumen de cierre", async () => {
    await import("../src/MCP/servidor-mcp");

    mocks.query.mockResolvedValue({
      rows: [
        {
          estado: "ACTIVO",
          total_creditos: "5",
          saldo_capital_centavos: "100000",
        },
      ],
    });

    const herramienta =
      mocks.herramientas.get("generar_resumen_cierre");

    const resultado = await herramienta.handler({
      fechaCorte: "2026-01-31",
    });

    const respuesta = JSON.parse(resultado.content[0].text);

    expect(respuesta.fechaCorte).toBe("2026-01-31");
    expect(respuesta.cierre).toHaveLength(1);
    expect(respuesta.cierre[0].saldoCapital).toBe("1000.00");
  });
});