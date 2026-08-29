import {
  describe,
  expect,
  it,
} from "vitest";

import {
  CreditoState,
} from "../src/dominio/estado-credito";

import {
  CalculadoraMora,
} from "../src/dominio/calculadora-mora";

describe("Estado del crédito", () => {
  it("permite el ciclo normal solicitado → aprobado → desembolsado → vigente", () => {
    const solicitado =
      CreditoState.crear("solicitado");

    expect(
      solicitado.aprobar()
    ).toBe("aprobado");

    const aprobado =
      CreditoState.crear("aprobado");

    expect(
      aprobado.desembolsar()
    ).toBe("desembolsado");

    const desembolsado =
      CreditoState.crear("desembolsado");

    expect(
      desembolsado.desembolsar()
    ).toBe("vigente");
  });

  it("un crédito con 45 días baja de Mora 2 a Mora 1 al pagar parcialmente", () => {
    const moraInicial =
      CalculadoraMora.determinarTramo(45);

    expect(moraInicial).toBe("mora_2");

    const diasDespuesDelPago = 10;

    const moraDespuesDelPago =
      CalculadoraMora.determinarTramo(
        diasDespuesDelPago
      );

    expect(
      moraDespuesDelPago
    ).toBe("mora_1");
  });

  it("al pagar todo lo vencido, un crédito en mora vuelve a vigente", () => {
    const enMora =
      CreditoState.crear("en_mora");

    expect(
      enMora.regularizar()
    ).toBe("vigente");
  });

  it("rechaza pagar un crédito solicitado", () => {
    const solicitado =
      CreditoState.crear("solicitado");

    expect(() =>
      solicitado.pagar()
    ).toThrow();
  });
});