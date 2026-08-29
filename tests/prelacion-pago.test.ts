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
});