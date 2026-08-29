import {
  describe,
  expect,
  it,
} from "vitest";

import { Dinero } from "../src/dominio/dinero";

import {
  DesembolsarCredito,
} from "../src/Aplicación/desembolsar-credito";

import {
  CreditoRepository,
} from "../src/Puertos/credito-repository";

describe("DesembolsarCredito", () => {
  function crearRepositorio(): CreditoRepository {
    const creditos = new Map();

    creditos.set("C-001", {
      creditoId: "C-001",
      clienteId: "CLI-001",
      saldoCapital:
        Dinero.desdeDecimal("0.00"),
      estado: "aprobado",
    });

    return {
      buscarPorId: (creditoId: string) =>
        creditos.get(creditoId),

      guardar: (credito) => {
        creditos.set(
          credito.creditoId,
          credito
        );
      },
    };
  }

  it("desembolsa un crédito aprobado", () => {
    const casoUso =
      new DesembolsarCredito(
        crearRepositorio()
      );

    const respuesta =
      casoUso.ejecutar({
        creditoId: "C-001",
        monto:
          Dinero.desdeDecimal(
            "5000.00"
          ),
      });

    expect(
      respuesta.creditoId
    ).toBe("C-001");

    expect(
      respuesta.montoDesembolsado
        .toDecimal()
    ).toBe("5000.00");

    expect(
      respuesta.estado
    ).toBe("vigente");
  });

  it("rechaza un crédito que no está aprobado", () => {
    const repo =
      crearRepositorio();

    repo.guardar({
      creditoId: "C-002",
      clienteId: "CLI-002",
      saldoCapital:
        Dinero.cero(),
      estado: "solicitado",
    });

    const casoUso =
      new DesembolsarCredito(repo);

    expect(() =>
      casoUso.ejecutar({
        creditoId: "C-002",
        monto:
          Dinero.desdeDecimal(
            "5000.00"
          ),
      })
    ).toThrow(
      "El crédito debe estar aprobado para ser desembolsado"
    );
  });

  it("rechaza un monto cero", () => {
    const casoUso =
      new DesembolsarCredito(
        crearRepositorio()
      );

    expect(() =>
      casoUso.ejecutar({
        creditoId: "C-001",
        monto:
          Dinero.desdeDecimal("0.00"),
      })
    ).toThrow();
  });

  it("rechaza un crédito inexistente", () => {
    const casoUso =
      new DesembolsarCredito(
        crearRepositorio()
      );

    expect(() =>
      casoUso.ejecutar({
        creditoId: "C-999",
        monto:
          Dinero.desdeDecimal(
            "5000.00"
          ),
      })
    ).toThrow(
      "Crédito no encontrado"
    );
  });
});