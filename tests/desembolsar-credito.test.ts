import { Clock } from "../src/Puertos/clock";
import { SelectorPoliticaMora } from "../src/dominio/politica-mora/selector-politica-mora";
import { describe, expect, it } from "vitest";
import { Dinero } from "../src/dominio/dinero";
import { DesembolsarCredito } from "../src/Aplicación/desembolsar-credito";
import { CreditoRepository } from "../src/Puertos/credito-repository";

describe("DesembolsarCredito", () => {
  const clock: Clock = {
    ahora: () => new Date("2026-09-17T12:00:00Z"),
  };

  const selectorPoliticaMora = new SelectorPoliticaMora();

  function crearRepositorio(): CreditoRepository {
    const creditos = new Map<string, any>();

    creditos.set("C-001", {
      creditoId: "C-001",
      clienteId: "CLI-001",
      saldoCapital: Dinero.desdeDecimal("0.00"),
      estado: "aprobado",
    });

    return {
      buscarPorId: async (creditoId: string) =>
        creditos.get(creditoId),

      listarTodos: async () =>
        Array.from(creditos.values()),

      guardar: async (credito) => {
        creditos.set(credito.creditoId, credito);
      },
    };
  }

  it("desembolsa un crédito aprobado", async () => {
    const casoUso = new DesembolsarCredito(
      crearRepositorio(),
      clock,
      selectorPoliticaMora
    );

    const respuesta = await casoUso.ejecutar({
      creditoId: "C-001",
      monto: Dinero.desdeDecimal("5000.00"),
    });

    expect(respuesta.creditoId).toBe("C-001");

    expect(
      respuesta.montoDesembolsado.toDecimal()
    ).toBe("5000.00");

    expect(respuesta.estado).toBe("vigente");
  });

  it("rechaza un crédito que no está aprobado", async () => {
    const repo = crearRepositorio();

    await repo.guardar({
      creditoId: "C-002",
      clienteId: "CLI-002",
      saldoCapital: Dinero.cero(),
      estado: "solicitado",
      fechaDesembolso: "2026-09-01",
      politicaMoraId: "POL-2024-01",
      interesEnSuspenso: Dinero.cero(),
    });

    const casoUso = new DesembolsarCredito(
      repo,
      clock,
      selectorPoliticaMora
    );

    await expect(
      casoUso.ejecutar({
        creditoId: "C-002",
        monto: Dinero.desdeDecimal("5000.00"),
      })
    ).rejects.toThrow(
      "El crédito debe estar aprobado para ser desembolsado"
    );
  });

  it("rechaza un monto cero", async () => {
    const casoUso = new DesembolsarCredito(
      crearRepositorio(),
      clock,
      selectorPoliticaMora
    );

    await expect(
      casoUso.ejecutar({
        creditoId: "C-001",
        monto: Dinero.desdeDecimal("0.00"),
      })
    ).rejects.toThrow();
  });

  it("rechaza un crédito inexistente", async () => {
    const casoUso = new DesembolsarCredito(
      crearRepositorio(),
      clock,
      selectorPoliticaMora
    );

    await expect(
      casoUso.ejecutar({
        creditoId: "C-999",
        monto: Dinero.desdeDecimal("5000.00"),
      })
    ).rejects.toThrow("Crédito no encontrado");
  });
});
