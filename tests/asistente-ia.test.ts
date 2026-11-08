import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  groqCreate: vi.fn(),
  mcpConnect: vi.fn(),
  mcpListTools: vi.fn(),
  mcpCallTool: vi.fn(),
  buscarContextoRAG: vi.fn(),
}));

vi.mock("groq-sdk", () => ({
  default: class Groq {
    chat = {
      completions: {
        create: mocks.groqCreate,
      },
    };
  },
}));

vi.mock("@modelcontextprotocol/sdk/client/index.js", () => ({
  Client: class Client {
    connect = mocks.mcpConnect;
    listTools = mocks.mcpListTools;
    callTool = mocks.mcpCallTool;
  },
}));

vi.mock(
  "@modelcontextprotocol/sdk/client/stdio.js",
  () => ({
    StdioClientTransport: class StdioClientTransport {},
  })
);

vi.mock("../src/Api/rag", () => ({
  buscarContextoRAG: mocks.buscarContextoRAG,
}));

describe("Evaluaciones del asistente IA", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();

    mocks.mcpConnect.mockResolvedValue(undefined);

    mocks.mcpListTools.mockResolvedValue({
      tools: [],
    });

    mocks.buscarContextoRAG.mockResolvedValue(
      "Documentación del sistema de microcréditos."
    );
  });

  it("responde correctamente a una consulta general", async () => {
    mocks.groqCreate.mockResolvedValue({
      choices: [
        {
          message: {
            role: "assistant",
            content:
              "El sistema permite gestionar microcréditos y consultar información financiera.",
          },
        },
      ],
    });

    const { responderAsistente } = await import(
      "../src/Api/asistente-ia"
    );

    const respuesta = await responderAsistente(
      "¿Qué permite hacer el sistema?",
      "sesion-1"
    );

    expect(respuesta).toContain("gestionar microcréditos");
    expect(mocks.groqCreate).toHaveBeenCalledTimes(1);
    expect(mocks.buscarContextoRAG).toHaveBeenCalledTimes(1);
  });

  it("incluye el contexto RAG en el prompt del sistema", async () => {
    mocks.buscarContextoRAG.mockResolvedValue(
      "La política POL-2026-10 utiliza tasas escalonadas."
    );

    mocks.groqCreate.mockResolvedValue({
      choices: [
        {
          message: {
            role: "assistant",
            content: "La política utiliza tasas escalonadas.",
          },
        },
      ],
    });

    const { responderAsistente } = await import(
      "../src/Api/asistente-ia"
    );

    await responderAsistente(
      "¿Cómo funciona la política de mora?",
      "sesion-2"
    );

    const llamada = mocks.groqCreate.mock.calls[0][0];

    expect(llamada.messages[0].content).toContain(
      "La política POL-2026-10 utiliza tasas escalonadas."
    );
  });

  it("consulta una herramienta MCP y devuelve la respuesta final", async () => {
    mocks.mcpListTools.mockResolvedValue({
      tools: [
        {
          name: "consultar_clientes",
          description: "Consulta clientes.",
          inputSchema: {
            type: "object",
            properties: {
              fechaCorte: {
                type: "string",
              },
            },
          },
        },
      ],
    });

    mocks.groqCreate
      .mockResolvedValueOnce({
        choices: [
          {
            message: {
              role: "assistant",
              content: null,
              tool_calls: [
                {
                  id: "llamada-1",
                  type: "function",
                  function: {
                    name: "consultar_clientes",
                    arguments: JSON.stringify({
                      fechaCorte: "2026-01-31",
                    }),
                  },
                },
              ],
            },
          },
        ],
      })
      .mockResolvedValueOnce({
        choices: [
          {
            message: {
              role: "assistant",
              content: "Se encontraron 3 clientes.",
            },
          },
        ],
      });

    mocks.mcpCallTool.mockResolvedValue({
      content: [
        {
          type: "text",
          text: JSON.stringify({
            total: 3,
          }),
        },
      ],
    });

    const { responderAsistente } = await import(
      "../src/Api/asistente-ia"
    );

    const respuesta = await responderAsistente(
      "Consulta los clientes al 31 de enero de 2026.",
      "sesion-3"
    );

    expect(mocks.mcpCallTool).toHaveBeenCalledWith({
      name: "consultar_clientes",
      arguments: {
        fechaCorte: "2026-01-31",
      },
    });

    expect(mocks.groqCreate).toHaveBeenCalledTimes(2);
    expect(respuesta).toBe("Se encontraron 3 clientes.");
  });

  it("maneja el límite de uso de Groq sin detener el sistema", async () => {
    const error = Object.assign(
      new Error("Rate limit exceeded"),
      {
        status: 429,
      }
    );

    mocks.groqCreate.mockRejectedValue(error);

    const { responderAsistente } = await import(
      "../src/Api/asistente-ia"
    );

    const respuesta = await responderAsistente(
      "Consulta el resumen de cartera.",
      "sesion-4"
    );

    expect(respuesta).toContain(
      "alcanzó temporalmente su límite de uso"
    );
  });

  it("devuelve un mensaje controlado si Groq no genera respuesta", async () => {
    mocks.groqCreate.mockResolvedValue({
      choices: [],
    });

    const { responderAsistente } = await import(
      "../src/Api/asistente-ia"
    );

    const respuesta = await responderAsistente(
      "Consulta la información.",
      "sesion-5"
    );

    expect(respuesta).toBe(
      "Ocurrió un error al procesar la consulta del asistente IA."
    );
  });
});