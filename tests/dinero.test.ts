import { describe, expect, it } from "vitest";
import { Dinero } from "../src/dominio/dinero";

describe("Dinero", () => {
  it("crea un importe correctamente", () => {
    const dinero = Dinero.desdeDecimal("1004.62");

    expect(dinero.toDecimal()).toBe("1004.62");
    expect(dinero.moneda).toBe("GTQ");
  });

  it("suma dos importes", () => {
    const a = Dinero.desdeDecimal("100.50");
    const b = Dinero.desdeDecimal("25.25");

    expect(a.sumar(b).toDecimal()).toBe("125.75");
  });

  it("resta dos importes", () => {
    const a = Dinero.desdeDecimal("100.50");
    const b = Dinero.desdeDecimal("25.25");

    expect(a.restar(b).toDecimal()).toBe("75.25");
  });

  it("crea correctamente cero", () => {
    const dinero = Dinero.cero();

    expect(dinero.toDecimal()).toBe("0.00");
    expect(dinero.esCero()).toBe(true);
  });

  it("rechaza un importe sin dos decimales", () => {
    expect(() =>
      Dinero.desdeDecimal("100")
    ).toThrow();
  });
});