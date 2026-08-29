import {
  describe,
  expect,
  it,
} from "vitest";

import { Dinero } from "../src/dominio/dinero";

import {
  GenerarCierre,
} from "../src/Aplicación/generar-cierre";

describe("GenerarCierre", () => {
  it("genera correctamente el cierre de cartera", () => {
    const casoUso =
      new GenerarCierre();

    const resultado =
      casoUso.ejecutar({
        fechaCorte: "2026-08-22",

        creditos: [
          {
            creditoId: "C-001",
            saldoCapital:
              Dinero.desdeDecimal(
                "1000.00"
              ),
            diasAtraso: 0,
            incobrable: false,
          },

          {
            creditoId: "C-002",
            saldoCapital:
              Dinero.desdeDecimal(
                "500.00"
              ),
            diasAtraso: 40,
            incobrable: false,
          },
        ],
      });

    expect(
      resultado.fechaCorte
    ).toBe("2026-08-22");

    expect(
      resultado.carteraActiva
        .toDecimal()
    ).toBe("1500.00");

    expect(
      resultado.saldoEnRiesgo
        .toDecimal()
    ).toBe("500.00");

    expect(
      resultado.porcentajeEnRiesgo
    ).toBeCloseTo(
      33.333333,
      5
    );
  });

  it("identifica el saldo incobrable", () => {
    const casoUso =
      new GenerarCierre();

    const resultado =
      casoUso.ejecutar({
        fechaCorte: "2026-08-22",

        creditos: [
          {
            creditoId: "C-001",
            saldoCapital:
              Dinero.desdeDecimal(
                "1000.00"
              ),
            diasAtraso: 0,
            incobrable: false,
          },

          {
            creditoId: "C-002",
            saldoCapital:
              Dinero.desdeDecimal(
                "300.00"
              ),
            diasAtraso: 120,
            incobrable: true,
          },
        ],
      });

    expect(
      resultado
        .dadoPorIncobrableEnElPeriodo
        .toDecimal()
    ).toBe("300.00");
  });
});