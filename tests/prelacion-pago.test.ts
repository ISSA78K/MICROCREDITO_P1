import { describe, expect, it } from "vitest";
import { Dinero } from "../src/dominio/dinero";
import { PrelacionPago } from "../src/dominio/prelacion-pago";

describe("PrelacionPago", () => {
  it("aplica el pago en el orden establecido", () => {
    const resultado = PrelacionPago.aplicar(
      Dinero.desdeDecimal("100.00"),
      {
        gastos: Dinero.desdeDecimal("10.00"),
        interesMoratorio: Dinero.desdeDecimal("20.00"),
        interesCorriente: Dinero.desdeDecimal("30.00"),
        capital: Dinero.desdeDecimal("100.00"),
      }
    );

    expect(resultado.gastos.toDecimal()).toBe("10.00");
    expect(
      resultado.interesMoratorio.toDecimal()
    ).toBe("20.00");
    expect(
      resultado.interesCorriente.toDecimal()
    ).toBe("30.00");
    expect(resultado.capital.toDecimal()).toBe("40.00");
    expect(resultado.excedente.toDecimal()).toBe("0.00");
  });

  it("el remanente llega a capital", () => {
    const resultado = PrelacionPago.aplicar(
      Dinero.desdeDecimal("200.00"),
      {
        gastos: Dinero.desdeDecimal("10.00"),
        interesMoratorio: Dinero.desdeDecimal("20.00"),
        interesCorriente: Dinero.desdeDecimal("30.00"),
        capital: Dinero.desdeDecimal("100.00"),
      }
    );

    expect(resultado.capital.toDecimal()).toBe("100.00");
    expect(resultado.excedente.toDecimal()).toBe("40.00");
  });

  it("no aplica más de lo adeudado en cada concepto", () => {
    const resultado = PrelacionPago.aplicar(
      Dinero.desdeDecimal("500.00"),
      {
        gastos: Dinero.desdeDecimal("10.00"),
        interesMoratorio: Dinero.desdeDecimal("20.00"),
        interesCorriente: Dinero.desdeDecimal("30.00"),
        capital: Dinero.desdeDecimal("100.00"),
      }
    );

    expect(resultado.gastos.toDecimal()).toBe("10.00");
    expect(
      resultado.interesMoratorio.toDecimal()
    ).toBe("20.00");
    expect(
      resultado.interesCorriente.toDecimal()
    ).toBe("30.00");
    expect(resultado.capital.toDecimal()).toBe("100.00");
    expect(resultado.excedente.toDecimal()).toBe("340.00");
  });

  it("la suma de las aplicaciones coincide con el pago", () => {
  const pago = Dinero.desdeDecimal("100.00");

  const resultado = PrelacionPago.aplicar(
    pago,
    {
      gastos: Dinero.desdeDecimal("10.00"),
      interesMoratorio: Dinero.desdeDecimal("20.00"),
      interesCorriente: Dinero.desdeDecimal("30.00"),
      capital: Dinero.desdeDecimal("100.00"),
    }
  );

  const aplicado =
    resultado.gastos
      .sumar(resultado.interesMoratorio)
      .sumar(resultado.interesCorriente)
      .sumar(resultado.capital)
      .sumar(resultado.excedente);

  expect(aplicado.toDecimal()).toBe("100.00");
});

it("reproduce exactamente el caso de referencia 6.6: pago de Q1,011.88", () => {
  const resultado = PrelacionPago.aplicar(
    Dinero.desdeDecimal("1011.88"),
    {
      gastos: Dinero.desdeDecimal("0.00"),
      interesMoratorio: Dinero.desdeDecimal("7.26"),
      interesCorriente: Dinero.desdeDecimal("278.86"),
      capital: Dinero.desdeDecimal("725.76"),
    }
  );

  expect(resultado.gastos.toDecimal()).toBe("0.00");

  expect(
    resultado.interesMoratorio.toDecimal()
  ).toBe("7.26");

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

  it("aplica el cargo de cobranza de Q25 antes de intereses y capital", () => {
    const resultado = PrelacionPago.aplicar(
      Dinero.desdeDecimal("1047.76"),
      {
        gastos: Dinero.desdeDecimal("25.00"),
        interesMoratorio:
          Dinero.desdeDecimal("18.14"),
        interesCorriente:
          Dinero.desdeDecimal("278.86"),
        capital:
          Dinero.desdeDecimal("725.76"),
      }
    );

    expect(resultado.gastos.toDecimal()).toBe("25.00");

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