import Decimal from "decimal.js";
import { Dinero } from "../dinero";
import {
  PoliticaMora,
  TramoPoliticaMora,
} from "./politica-mora";

export class PoliticaPlana implements PoliticaMora {
  readonly id = "POL-2024-01";
  readonly fechaVigencia = "2024-01-01";

  obtenerTramos(): readonly TramoPoliticaMora[] {
    return [
      {
        desdeDia: 1,
        hastaDia: null,
        tasaAnual: 0.24,
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

    const capital = new Decimal(
      capitalEnMora.centavos.toString()
    );

    const tasaDiaria = new Decimal("0.24").div(360);

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
}