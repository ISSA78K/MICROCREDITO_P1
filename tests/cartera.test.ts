import { describe, expect, it } from "vitest";
import { Dinero } from "../src/dominio/dinero";
import { Cartera } from "../src/dominio/cartera";

describe("Cartera", () => {
  it("calcula la cartera activa", () => {
    const resultado = Cartera.calcular([
      {
        creditoId: "C-001",
        saldoCapital: Dinero.desdeDecimal("1000.00"),
        diasAtraso: 0,
        reestructurado: false,
        incobrable: false,
      },
      {
        creditoId: "C-002",
        saldoCapital: Dinero.desdeDecimal("500.00"),
        diasAtraso: 40,
        reestructurado: false,
        incobrable: false,
      },
    ]);

    expect(
      resultado.carteraActiva.toDecimal()
    ).toBe("1500.00");
  });

  it("considera en riesgo un crédito con más de 30 días", () => {
    const resultado = Cartera.calcular([
      {
        creditoId: "C-001",
        saldoCapital: Dinero.desdeDecimal("1000.00"),
        diasAtraso: 31,
        reestructurado: false,
        incobrable: false,
      },
      {
        creditoId: "C-002",
        saldoCapital: Dinero.desdeDecimal("500.00"),
        diasAtraso: 10,
        reestructurado: false,
        incobrable: false,
      },
    ]);

    expect(
      resultado.saldoEnRiesgo.toDecimal()
    ).toBe("1000.00");
  });

  it("calcula el porcentaje de cartera en riesgo", () => {
    const resultado = Cartera.calcular([
      {
        creditoId: "C-001",
        saldoCapital: Dinero.desdeDecimal("1000.00"),
        diasAtraso: 40,
        reestructurado: false,
        incobrable: false,
      },
      {
        creditoId: "C-002",
        saldoCapital: Dinero.desdeDecimal("1000.00"),
        diasAtraso: 0,
        reestructurado: false,
        incobrable: false,
      },
    ]);

    expect(
      resultado.porcentajeEnRiesgo
    ).toBe(50);
  });

  it("excluye incobrables de la cartera activa", () => {
    const resultado = Cartera.calcular([
      {
        creditoId: "C-001",
        saldoCapital: Dinero.desdeDecimal("1000.00"),
        diasAtraso: 150,
        reestructurado: false,
        incobrable: true,
      },
      {
        creditoId: "C-002",
        saldoCapital: Dinero.desdeDecimal("500.00"),
        diasAtraso: 0,
        reestructurado: false,
        incobrable: false,
      },
    ]);

    expect(
      resultado.carteraActiva.toDecimal()
    ).toBe("500.00");
  });

  it("un crédito con exactamente 30 días no está en riesgo", () => {
    const resultado = Cartera.calcular([
      {
        creditoId: "C-001",
        saldoCapital: Dinero.desdeDecimal("1000.00"),
        diasAtraso: 30,
        reestructurado: false,
        incobrable: false,
      },
    ]);

    expect(
      resultado.saldoEnRiesgo.toDecimal()
    ).toBe("0.00");
  });

  it("un crédito con 31 días sí está en riesgo", () => {
    const resultado = Cartera.calcular([
      {
        creditoId: "C-001",
        saldoCapital: Dinero.desdeDecimal("1000.00"),
        diasAtraso: 31,
        reestructurado: false,
        incobrable: false,
      },
    ]);

    expect(
      resultado.saldoEnRiesgo.toDecimal()
    ).toBe("1000.00");
  });

  it("reproduce el caso de referencia de cartera en riesgo: 7.00%", () => {
    const resultado = Cartera.calcular([
      {
        creditoId: "C-001",
        saldoCapital: Dinero.desdeDecimal("620000.00"),
        diasAtraso: 0,
        reestructurado: false,
        incobrable: false,
      },
      {
        creditoId: "C-002",
        saldoCapital: Dinero.desdeDecimal("124000.00"),
        diasAtraso: 8,
        reestructurado: false,
        incobrable: false,
      },
      {
        creditoId: "C-003",
        saldoCapital: Dinero.desdeDecimal("24000.00"),
        diasAtraso: 45,
        reestructurado: false,
        incobrable: false,
      },
      {
        creditoId: "C-004",
        saldoCapital: Dinero.desdeDecimal("18000.00"),
        diasAtraso: 75,
        reestructurado: false,
        incobrable: false,
      },
      {
        creditoId: "C-005",
        saldoCapital: Dinero.desdeDecimal("8000.00"),
        diasAtraso: 100,
        reestructurado: false,
        incobrable: false,
      },
      {
        creditoId: "C-006",
        saldoCapital: Dinero.desdeDecimal("6000.00"),
        diasAtraso: 0,
        reestructurado: true,
        incobrable: false,
      },
      {
        creditoId: "C-007",
        saldoCapital: Dinero.desdeDecimal("15000.00"),
        diasAtraso: 210,
        reestructurado: false,
        incobrable: true,
      },
    ]);

    expect(
      resultado.carteraActiva.toDecimal()
    ).toBe("800000.00");

    expect(
      resultado.saldoEnRiesgo.toDecimal()
    ).toBe("56000.00");

    expect(
      resultado.porcentajeEnRiesgo
    ).toBe(7);
  });

  it("reproduce el caso de referencia después de declarar C-005 incobrable: 6.06%", () => {
    const resultado = Cartera.calcular([
      {
        creditoId: "C-001",
        saldoCapital: Dinero.desdeDecimal("620000.00"),
        diasAtraso: 0,
        reestructurado: false,
        incobrable: false,
      },
      {
        creditoId: "C-002",
        saldoCapital: Dinero.desdeDecimal("124000.00"),
        diasAtraso: 8,
        reestructurado: false,
        incobrable: false,
      },
      {
        creditoId: "C-003",
        saldoCapital: Dinero.desdeDecimal("24000.00"),
        diasAtraso: 45,
        reestructurado: false,
        incobrable: false,
      },
      {
        creditoId: "C-004",
        saldoCapital: Dinero.desdeDecimal("18000.00"),
        diasAtraso: 75,
        reestructurado: false,
        incobrable: false,
      },
      {
        creditoId: "C-005",
        saldoCapital: Dinero.desdeDecimal("8000.00"),
        diasAtraso: 100,
        reestructurado: false,
        incobrable: true,
      },
      {
        creditoId: "C-006",
        saldoCapital: Dinero.desdeDecimal("6000.00"),
        diasAtraso: 0,
        reestructurado: true,
        incobrable: false,
      },
      {
        creditoId: "C-007",
        saldoCapital: Dinero.desdeDecimal("15000.00"),
        diasAtraso: 210,
        reestructurado: false,
        incobrable: true,
      },
    ]);

    expect(
      resultado.carteraActiva.toDecimal()
    ).toBe("792000.00");

    expect(
      resultado.saldoEnRiesgo.toDecimal()
    ).toBe("48000.00");

    expect(
  resultado.porcentajeEnRiesgo
).toBeCloseTo(6.06, 2);
  });
});