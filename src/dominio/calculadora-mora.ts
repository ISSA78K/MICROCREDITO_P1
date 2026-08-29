import { differenceInCalendarDays, parseISO } from "date-fns";
import Decimal from "decimal.js";
import { Dinero } from "./dinero";

export type TramoMora =
  | "ninguno"
  | "mora_1"
  | "mora_2"
  | "mora_3"
  | "vencido";

export interface ResultadoMora {
  diasAtraso: number;
  tramo: TramoMora;
  interesMoratorio: Dinero;
}

export class CalculadoraMora {
  static calcularDiasAtraso(
    fechaVencimiento: string,
    fechaCorte: string
  ): number {
    const vencimiento = parseISO(fechaVencimiento);
    const corte = parseISO(fechaCorte);

    const dias = differenceInCalendarDays(
      corte,
      vencimiento
    );

    return Math.max(0, dias);
  }

  static determinarTramo(
    diasAtraso: number
  ): TramoMora {
    if (diasAtraso <= 0) {
      return "ninguno";
    }

    if (diasAtraso <= 30) {
      return "mora_1";
    }

    if (diasAtraso <= 60) {
      return "mora_2";
    }

    if (diasAtraso <= 90) {
      return "mora_3";
    }

    return "vencido";
  }

  static calcularInteresMoratorio(
    capitalEnMora: Dinero,
    tasaDiaria: number,
    diasAtraso: number
  ): Dinero {
    if (diasAtraso <= 0) {
      return Dinero.cero();
    }

    const capital = new Decimal(
      capitalEnMora.centavos.toString()
    );

    const tasa = new Decimal(
      tasaDiaria.toString()
    );

    const interesCentavos = capital
      .mul(tasa)
      .mul(diasAtraso)
      .toDecimalPlaces(
        0,
        Decimal.ROUND_HALF_UP
      );

    return new Dinero(
      BigInt(interesCentavos.toFixed(0))
    );
  }

  static calcular(
    fechaVencimiento: string,
    fechaCorte: string,
    capitalEnMora: Dinero,
    tasaDiaria: number
  ): ResultadoMora {
    const diasAtraso =
      this.calcularDiasAtraso(
        fechaVencimiento,
        fechaCorte
      );

    const tramo =
      this.determinarTramo(diasAtraso);

    const interesMoratorio =
      this.calcularInteresMoratorio(
        capitalEnMora,
        tasaDiaria,
        diasAtraso
      );

    return {
      diasAtraso,
      tramo,
      interesMoratorio,
    };
  }
}