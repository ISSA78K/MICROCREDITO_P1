import Decimal from "decimal.js";
import { Dinero } from "./dinero";

export interface CreditoCartera {
  creditoId: string;
  saldoCapital: Dinero;
  diasAtraso: number;
  reestructurado?: boolean;
  incobrable: boolean;
}

export interface ResultadoCartera {
  carteraActiva: Dinero;
  saldoEnRiesgo: Dinero;
  porcentajeEnRiesgo: number;
  porTramo: Record<string, Dinero>;
  dadoPorIncobrableEnElPeriodo: Dinero;
}

export class Cartera {
  static calcular(
    creditos: CreditoCartera[]
  ): ResultadoCartera {
    let carteraActiva = Dinero.cero();
    let saldoEnRiesgo = Dinero.cero();

    const porTramo: Record<string, Dinero> = {};

    let dadoPorIncobrableEnElPeriodo =
      Dinero.cero();

    for (const credito of creditos) {
      if (credito.incobrable) {
        dadoPorIncobrableEnElPeriodo =
          dadoPorIncobrableEnElPeriodo.sumar(
            credito.saldoCapital
          );

        continue;
      }

      carteraActiva =
        carteraActiva.sumar(
          credito.saldoCapital
        );

      const estaEnRiesgo =
  credito.diasAtraso > 30 ||
  credito.reestructurado === true;

      if (estaEnRiesgo) {
        saldoEnRiesgo =
          saldoEnRiesgo.sumar(
            credito.saldoCapital
          );

        const tramo =
          this.determinarTramo(
            credito.diasAtraso
          );

        porTramo[tramo] =
          (porTramo[tramo] ?? Dinero.cero())
            .sumar(credito.saldoCapital);
      }
    }

    const porcentajeEnRiesgo =
    carteraActiva.centavos === 0n
    ? 0
    : new Decimal(
        saldoEnRiesgo.centavos.toString()
      )
        .div(
          carteraActiva.centavos.toString()
        )
        .mul(100)
        .toNumber();

    return {
      carteraActiva,
      saldoEnRiesgo,
      porcentajeEnRiesgo,
      porTramo,
      dadoPorIncobrableEnElPeriodo,
    };
  }

  private static determinarTramo(
    dias: number
  ): string {
    if (dias <= 30) return "mora_1";
    if (dias <= 60) return "mora_2";
    if (dias <= 90) return "mora_3";
    return "vencido";
  }
}