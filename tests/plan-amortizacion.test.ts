import { describe, expect, it } from "vitest";
import { Dinero } from "../src/dominio/dinero";
import { PlanAmortizacion } from "../src/dominio/plan-amortizacion";

describe("PlanAmortizacion", () => {
  const parametrosReferencia = {
    principal: Dinero.desdeDecimal("10000.00"),
    tasaMensual: 0.03,
    numeroCuotas: 12,
  };

  it("genera el número correcto de cuotas del caso de referencia", () => {
    const plan = PlanAmortizacion.generar(parametrosReferencia);

    expect(plan).toHaveLength(12);
  });

  it("la primera cuota del caso de referencia tiene interés y capital correctos", () => {
    const plan = PlanAmortizacion.generar(parametrosReferencia);

    expect(plan[0].interes.toDecimal()).toBe("300.00");
    expect(plan[0].capital.toDecimal()).toBe("704.62");
    expect(plan[0].cuota.toDecimal()).toBe("1004.62");
    expect(plan[0].saldo.toDecimal()).toBe("9295.38");
  });

  it("la última cuota deja saldo cero", () => {
    const plan = PlanAmortizacion.generar(parametrosReferencia);

    expect(plan[11].saldo.toDecimal()).toBe("0.00");
  });

  it("rechaza un número de cuotas inválido", () => {
    expect(() =>
      PlanAmortizacion.generar({
        principal: Dinero.desdeDecimal("10000.00"),
        tasaMensual: 0.03,
        numeroCuotas: 0,
      })
    ).toThrow();
  });

  it("mantiene la identidad cuota = capital + interés", () => {
    const plan = PlanAmortizacion.generar(parametrosReferencia);

    for (const cuota of plan) {
      expect(
        cuota.capital.sumar(cuota.interes).toDecimal()
      ).toBe(cuota.cuota.toDecimal());
    }
  });

  it("el saldo nunca termina siendo negativo", () => {
    const plan = PlanAmortizacion.generar(parametrosReferencia);

    for (const cuota of plan) {
      expect(cuota.saldo.centavos).toBeGreaterThanOrEqual(0n);
    }
  });

  it("la suma de amortizaciones es exactamente igual al principal", () => {
    const plan = PlanAmortizacion.generar(parametrosReferencia);

    const totalCapital = plan.reduce(
      (total, cuota) => total + cuota.capital.centavos,
      0n
    );

    expect(totalCapital).toBe(
      Dinero.desdeDecimal("10000.00").centavos
    );
  });

  it("reproduce exactamente las 12 filas del caso de referencia 6.4.1", () => {
    const plan = PlanAmortizacion.generar(parametrosReferencia);

    const esperado = [
      ["10000.00", "1004.62", "300.00", "704.62", "9295.38"],
      ["9295.38", "1004.62", "278.86", "725.76", "8569.62"],
      ["8569.62", "1004.62", "257.09", "747.53", "7822.09"],
      ["7822.09", "1004.62", "234.66", "769.96", "7052.13"],
      ["7052.13", "1004.62", "211.56", "793.06", "6259.07"],
      ["6259.07", "1004.62", "187.77", "816.85", "5442.22"],
      ["5442.22", "1004.62", "163.27", "841.35", "4600.87"],
      ["4600.87", "1004.62", "138.03", "866.59", "3734.28"],
      ["3734.28", "1004.62", "112.03", "892.59", "2841.69"],
      ["2841.69", "1004.62", "85.25", "919.37", "1922.32"],
      ["1922.32", "1004.62", "57.67", "946.95", "975.37"],
      ["975.37", "1004.63", "29.26", "975.37", "0.00"],
    ];

    expect(plan).toHaveLength(12);

    plan.forEach((cuota, index) => {
      expect(cuota.saldo.toDecimal()).toBe(esperado[index][4]);
      expect(cuota.cuota.toDecimal()).toBe(esperado[index][1]);
      expect(cuota.interes.toDecimal()).toBe(esperado[index][2]);
      expect(cuota.capital.toDecimal()).toBe(esperado[index][3]);
    });
  });
});