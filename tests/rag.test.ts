import { describe, it, expect, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
  readdir: vi.fn(),
  readFile: vi.fn(),
  pipeline: vi.fn(),
}));

vi.mock("node:fs/promises", () => ({
  default: {
    readdir: mocks.readdir,
    readFile: mocks.readFile,
  },
}));

vi.mock("@huggingface/transformers", () => ({
  pipeline: mocks.pipeline,
}));

describe("Cargador canónico RAG", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();

    mocks.readdir.mockResolvedValue([
      "politica-mora.md",
      "manual.md",
      "imagen.png",
    ]);

    mocks.readFile.mockImplementation(
      async (ruta: string) => {
        if (ruta.includes("politica-mora.md")) {
          return "La política de mora escalonada aplica tasas progresivas.";
        }

        if (ruta.includes("manual.md")) {
          return "El sistema de microcréditos administra créditos y cuotas.";
        }

        return "";
      }
    );

    mocks.pipeline.mockResolvedValue(
      vi.fn().mockImplementation(async (texto: string) => {
        const contenido = String(texto).toLowerCase();

        let vector: number[];

        if (
          contenido.includes("mora") ||
          contenido.includes("escalonada")
        ) {
          vector = [1, 0, 0];
        } else if (
          contenido.includes("microcréditos") ||
          contenido.includes("cuotas")
        ) {
          vector = [0, 1, 0];
        } else {
          vector = [0, 0, 1];
        }

        return {
          data: new Float32Array(vector),
        };
      })
    );
  });

  it("carga los documentos Markdown del corpus", async () => {
    const { cargarIndiceRAG } = await import("../src/Api/rag");

    await expect(cargarIndiceRAG()).resolves.toBeUndefined();

    expect(mocks.readdir).toHaveBeenCalledTimes(1);

    expect(mocks.readFile).toHaveBeenCalledTimes(2);

    expect(mocks.pipeline).toHaveBeenCalledTimes(1);
  });

  it("ignora los archivos que no son Markdown", async () => {
    const { cargarIndiceRAG } = await import("../src/Api/rag");

    await cargarIndiceRAG();

    const archivosLeidos = mocks.readFile.mock.calls.map(
      (llamada) => String(llamada[0])
    );

    expect(
      archivosLeidos.some((ruta) => ruta.includes("imagen.png"))
    ).toBe(false);
  });

  it("busca contexto relacionado con la consulta", async () => {
    const { buscarContextoRAG } = await import("../src/Api/rag");

    const resultado = await buscarContextoRAG(
      "política de mora escalonada"
    );

    expect(resultado).toContain("politica-mora.md");

    expect(resultado).toContain(
      "La política de mora escalonada aplica tasas progresivas."
    );

    expect(resultado).toContain("[Fuente 1:");
  });

  it("devuelve los resultados limitados a la cantidad solicitada", async () => {
    const { buscarContextoRAG } = await import("../src/Api/rag");

    const resultado = await buscarContextoRAG(
      "microcréditos y cuotas",
      1
    );

    expect(resultado).toContain("manual.md");

    expect(resultado).not.toContain("politica-mora.md");
  });

  it("genera un error si no existen documentos Markdown", async () => {
    mocks.readdir.mockResolvedValue(["imagen.png", "archivo.txt"]);

    const { cargarIndiceRAG } = await import("../src/Api/rag");

    await expect(cargarIndiceRAG()).rejects.toThrow(
      "No se encontraron documentos Markdown en el corpus."
    );
  });

  it("genera un error si el corpus no puede leerse", async () => {
    mocks.readdir.mockRejectedValue(
      new Error("Carpeta corpus no encontrada")
    );

    const { cargarIndiceRAG } = await import("../src/Api/rag");

    await expect(cargarIndiceRAG()).rejects.toThrow(
      "Carpeta corpus no encontrada"
    );
  });
});