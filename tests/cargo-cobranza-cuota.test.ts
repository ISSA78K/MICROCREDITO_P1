import { describe, expect, it } from "vitest";
import { Dinero } from "../src/dominio/dinero";
import { CargoCobranza } from "../src/dominio/cargo-cobranza";
import { PlanAmortizacion} from "../src/dominio/plan-amortizacion";
import { PrelacionPago } from "../src/dominio/prelacion-pago";

describe("Cargo de cobranza sobre cuota", () => {
  it("genera Q25 una sola vez al entrar en Mora 2", () => {
    const plan = PlanAmortizacion.generar({
      principal:
        Dinero.desdeDecimal("10000.00"),
      tasaMensual: 0.03,
      numeroCuotas: 12,
    });

    const cuota = plan[1];

    cuota.diasAtraso = 31;

    expect(
      CargoCobranza.corresponde(
        cuota.diasAtraso,
        cuota.cargoCobranzaGenerado
      )
    ).toBe(true);

    const cargo =
      CargoCobranza.generar();

    cuota.cargoCobranzaGenerado = true;

    expect(
      cargo.toDecimal()
    ).toBe("25.00");

    expect(
      CargoCobranza.corresponde(
        cuota.diasAtraso,
        cuota.cargoCobranzaGenerado
      )
    ).toBe(false);
  });

    it("calcula Q25 para una cuota real en Mora 2", () => {
    const plan = PlanAmortizacion.generar({
      principal:
        Dinero.desdeDecimal("10000.00"),
      tasaMensual: 0.03,
      numeroCuotas: 12,
    });

    const cuota = plan[1];

    cuota.diasAtraso = 45;

    const gastos =
      CargoCobranza.calcularParaCuota(
        cuota
      );

    expect(
      gastos.toDecimal()
    ).toBe("25.00");
  });

  it("prepara el cargo Q25 como gastos para la prelación", () => {
    const plan = PlanAmortizacion.generar({
      principal:
        Dinero.desdeDecimal("10000.00"),
      tasaMensual: 0.03,
      numeroCuotas: 12,
    });

    const cuota = plan[1];

    cuota.diasAtraso = 45;

    const gastos =
      CargoCobranza.calcularParaCuota(
        cuota
      );

    const resultado =
      PrelacionPago.aplicar(
        Dinero.desdeDecimal("1047.76"),
        {
          gastos,
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