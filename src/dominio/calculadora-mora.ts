import { differenceInCalendarDays, parseISO } from "date-fns";
import { Dinero } from "./dinero";
import { PoliticaMora } from "./politica-mora/politica-mora";
import { PoliticaPlana } from "./politica-mora/politica-plana";

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
  interesEnSuspenso: Dinero;
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

    const capitalCentavos =
      capitalEnMora.centavos;

    const interes =
      Number(capitalCentavos) *
      tasaDiaria *
      diasAtraso;

    return new Dinero(
      BigInt(Math.round(interes))
    );
  }

  static calcularConPolitica(
    fechaVencimiento: string,
    fechaCorte: string,
    capitalEnMora: Dinero,
    politica: PoliticaMora
  ): ResultadoMora {
    const diasAtraso =
      this.calcularDiasAtraso(
        fechaVencimiento,
        fechaCorte
      );

    const tramo =
      this.determinarTramo(diasAtraso);

    const diasInteresCorriente =
  Math.min(diasAtraso, 90);

const interesMoratorio =
  politica.calcularInteres(
    capitalEnMora,
    diasInteresCorriente
  );

const interesTotal =
  politica.calcularInteres(
    capitalEnMora,
    diasAtraso
  );

const interesEnSuspenso =
  interesTotal.centavos >=
  interesMoratorio.centavos
    ? interesTotal.restar(
        interesMoratorio
      )
    : Dinero.cero();

return {
  diasAtraso,
  tramo,
  interesMoratorio,
  interesEnSuspenso,
};
  }

  static calcular(
    fechaVencimiento: string,
    fechaCorte: string,
    capitalEnMora: Dinero,
    tasaDiaria: number
  ): ResultadoMora {
    const politica = new PoliticaPlana();

    const diasAtraso =
      this.calcularDiasAtraso(
        fechaVencimiento,
        fechaCorte
      );

    const tramo =
      this.determinarTramo(diasAtraso);

    const diasInteresCorriente =
  Math.min(diasAtraso, 90);

const interesMoratorio =
  politica.calcularInteres(
    capitalEnMora,
    diasInteresCorriente
  );

const interesTotal =
  politica.calcularInteres(
    capitalEnMora,
    diasAtraso
  );

const interesPrimeros90 =
  interesMoratorio;

const interesEnSuspenso =
  interesTotal.restar(
    interesPrimeros90
  );

    return {
      diasAtraso,
      tramo,
      interesMoratorio,
      interesEnSuspenso,
    };
  }
}