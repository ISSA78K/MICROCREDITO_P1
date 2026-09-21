import Decimal from "decimal.js";
import { Dinero } from "../dinero";
import {
  PoliticaMora,
  TramoPoliticaMora,
} from "./politica-mora";

export class PoliticaEscalonada
  implements PoliticaMora
{
  readonly id = "POL-2026-10";
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

    if (diasAtraso > 120) {
      return Dinero.cero();
    }

    const capital = new Decimal(
      capitalEnMora.centavos.toString()
    );

    let interes = new Decimal(0);

    const tramos = this.obtenerTramos();

    for (const tramo of tramos) {
      if (diasAtraso < tramo.desdeDia) {
        break;
      }

      const limite =
        tramo.hastaDia ?? diasAtraso;

      const diasEnTramo =
        Math.min(diasAtraso, limite) -
        tramo.desdeDia +
        1;

      if (diasEnTramo <= 0) {
        continue;
      }

      const tasaDiaria =
        new Decimal(
          tramo.tasaAnual.toString()
        ).div(360);

      interes = interes.add(
        capital
          .mul(tasaDiaria)
          .mul(diasEnTramo)
      );
    }

    const interesCentavos = interes
      .toDecimalPlaces(
        0,
        Decimal.ROUND_HALF_UP
      );

    return new Dinero(
      BigInt(interesCentavos.toFixed(0))
    );
  }
}