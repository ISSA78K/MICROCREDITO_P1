import { PoliticaEscalonada } from "../src/dominio/politica-mora/politica-escalonada";
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
      it("CP-04.2: suspende el interés desde el día 91", () => {
  const politica = new PoliticaEscalonada();
  const capital = Dinero.desdeDecimal("725.76");

  const dia90 =
    CalculadoraMora.calcularConPolitica(
      "2026-06-01",
      "2026-08-30",
      capital,
      politica
    );

  const dia91 =
    CalculadoraMora.calcularConPolitica(
      "2026-06-01",
      "2026-08-31",
      capital,
      politica
    );

  expect(dia90.diasAtraso).toBe(90);
  expect(dia91.diasAtraso).toBe(91);

  expect(
    dia90.interesEnSuspenso.toDecimal()
  ).toBe("0.00");

  expect(
    dia91.interesEnSuspenso.esPositivo()
  ).toBe(true);
});
it("CP-04.2: el interés en suspenso nunca es negativo después del día 120", () => {
  const politica = new PoliticaEscalonada();
  const capital = Dinero.desdeDecimal("725.76");

  const resultado =
    CalculadoraMora.calcularConPolitica(
      "2026-06-01",
      "2026-10-01",
      capital,
      politica
    );

  expect(resultado.diasAtraso).toBe(122);

  expect(
    resultado.interesEnSuspenso.centavos
  ).toBeGreaterThanOrEqual(0n);
});
});