import { describe, expect, it } from "vitest";
import { CargoCobranza } from "../src/dominio/cargo-cobranza";
import { Dinero } from "../src/dominio/dinero";
import { PrelacionPago } from "../src/dominio/prelacion-pago";

describe("Cargo de cobranza", () => {
  it("no genera cargo durante Mora 1", () => {
    expect(
      CargoCobranza.corresponde(30, false)
    ).toBe(false);
  });

  it("genera Q25 al entrar en Mora 2", () => {
    expect(
      CargoCobranza.corresponde(31, false)
    ).toBe(true);

    expect(
      CargoCobranza.generar().toDecimal()
    ).toBe("25.00");
  });

  it("genera Q25 para una cuota con 45 días de atraso", () => {
    expect(
      CargoCobranza.corresponde(45, false)
    ).toBe(true);
  });

  it("no duplica el cargo si ya fue generado", () => {
    expect(
      CargoCobranza.corresponde(45, true)
    ).toBe(false);
  });

    it("calcula el total de la cuota M-5 con cargo de cobranza", () => {
    const gastos =
      CargoCobranza.generar();

    const interesMoratorio =
      Dinero.desdeDecimal("18.14");

    const interesCorriente =
      Dinero.desdeDecimal("278.86");

    const capital =
      Dinero.desdeDecimal("725.76");

    const total =
      gastos
        .sumar(interesMoratorio)
        .sumar(interesCorriente)
        .sumar(capital);

    expect(total.toDecimal()).toBe("1047.76");
  });

    it("integra el cargo Q25 con la prelación del caso M-5", () => {
    const pago =
      Dinero.desdeDecimal("1047.76");

    const resultado =
      PrelacionPago.aplicar(
        pago,
        {
          gastos:
            CargoCobranza.generar(),
          interesMoratorio:
            Dinero.desdeDecimal("18.14"),
          interesCorriente:
            Dinero.desdeDecimal("278.86"),
          capital:
            Dinero.desdeDecimal("725.76"),
        }
      );

    expect(
      resultado.gastos.toDecimal()
    ).toBe("25.00");

    expect(
      resultado.interesMoratorio.toDecimal()
    ).toBe("18.14");

    expect(
      resultado.interesCorriente.toDecimal()
    ).toBe("278.86");

    expect(
      resultado.capital.toDecimal()
    ).toBe("725.76");

    expect(
      resultado.excedente.toDecimal()
    ).toBe("0.00");
  });

});