import { describe, expect, it } from "vitest";
it("no calcula mora sobre una cuota que todavía no vence", () => {
  const resultado =
    CalculadoraMora.calcular(
      "2026-08-20",
      "2026-08-20",
      Dinero.desdeDecimal("1000.00"),
      0.001
    );

  expect(resultado.diasAtraso).toBe(0);
  expect(resultado.tramo).toBe("ninguno");
  expect(
    resultado.interesMoratorio.toDecimal()
  ).toBe("0.00");
});

it("calcula mora solamente sobre el capital en mora", () => {
  const resultado =
    CalculadoraMora.calcularInteresMoratorio(
      Dinero.desdeDecimal("1000.00"),
      0.001,
      10
    );

  expect(
    resultado.toDecimal()
  ).toBe("10.00");
});

import { Dinero } from "../src/dominio/dinero";
import { CalculadoraMora } from "../src/dominio/calculadora-mora";

describe("CalculadoraMora", () => {
  it("calcula correctamente los días de atraso", () => {
    expect(
      CalculadoraMora.calcularDiasAtraso(
        "2026-08-01",
        "2026-08-11"
      )
    ).toBe(10);
  });

  it("reproduce el interés moratorio de Q7.26 del caso de referencia", () => {
  const resultado =
    CalculadoraMora.calcularInteresMoratorio(
      Dinero.desdeDecimal("725.76"),
      0.24 / 360,
      15
    );

  expect(resultado.toDecimal()).toBe("7.26");
});

  it("clasifica mora de 1 a 30 días", () => {
    expect(
      CalculadoraMora.determinarTramo(15)
    ).toBe("mora_1");
  });

  it("clasifica mora de 31 a 60 días", () => {
    expect(
      CalculadoraMora.determinarTramo(45)
    ).toBe("mora_2");
  });

  it("clasifica mora de 61 a 90 días", () => {
    expect(
      CalculadoraMora.determinarTramo(75)
    ).toBe("mora_3");
  });

  it("clasifica vencido después de 90 días", () => {
    expect(
      CalculadoraMora.determinarTramo(100)
    ).toBe("vencido");
  });

  it("no genera interés si no existe atraso", () => {
    const resultado =
      CalculadoraMora.calcularInteresMoratorio(
        Dinero.desdeDecimal("1000.00"),
        0.001,
        0
      );

    expect(resultado.toDecimal()).toBe("0.00");
  });
});