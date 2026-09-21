import Decimal from "decimal.js";
import { Dinero } from "../dinero";
import {
  PoliticaMora,
  TramoPoliticaMora,
} from "./politica-mora";

export class PoliticaRetroactiva implements PoliticaMora {
  readonly id = "POL-RETROACTIVA-TEST";
  readonly fechaVigencia = "2026-10-01";

  obtenerTramos(): readonly TramoPoliticaMora[] {
    return [
      {
        desdeDia: 1,
        hastaDia: 30,
        tasaAnual: 0.18,
      },
      {
        desdeDia: 31,
        hastaDia: 60,
        tasaAnual: 0.24,
      },
      {
        desdeDia: 61,
        hastaDia: 90,
        tasaAnual: 0.30,
      },
      {
        desdeDia: 91,
        hastaDia: 120,
        tasaAnual: 0.36,
      },
    ];
  }

  calcularInteres(
    capitalEnMora: Dinero,
    diasAtraso: number
  ): Dinero {
    if (diasAtraso <= 0) {
      return Dinero.cero();
    }

    const tramo = this.obtenerTramoActual(diasAtraso);

    if (!tramo) {
      return Dinero.cero();
    }

    const capital = new Decimal(
      capitalEnMora.centavos.toString()
    );

    const tasaDiaria = new Decimal(
      tramo.tasaAnual.toString()
    ).div(360);

    const interesCentavos = capital
      .mul(tasaDiaria)
      .mul(diasAtraso)
      .toDecimalPlaces(
        0,
        Decimal.ROUND_HALF_UP
      );

    return new Dinero(
      BigInt(interesCentavos.toFixed(0))
    );
  }

  private obtenerTramoActual(
    diasAtraso: number
  ): TramoPoliticaMora | undefined {
    return this.obtenerTramos().find(
      (tramo) =>
        diasAtraso >= tramo.desdeDia &&
        (tramo.hastaDia === null ||
          diasAtraso <= tramo.hastaDia)
    );
  }
}