import Decimal from "decimal.js";
import { Dinero } from "./dinero";

export interface Cuota {
  numero: number;
  capital: Dinero;
  interes: Dinero;
  cuota: Dinero;
  saldo: Dinero;
}

export interface ParametrosAmortizacion {
  principal: Dinero;
  tasaMensual: number;
  numeroCuotas: number;
}

/**
 * Strategy para calcular la cuota de un plan de amortización.
 */
export interface EstrategiaAmortizacion {
  calcularCuota(
    principal: Dinero,
    tasaMensual: Decimal,
    numeroCuotas: number
  ): Decimal;
}

/**
 * Estrategia de amortización francesa.
 */
export class EstrategiaFrancesa implements EstrategiaAmortizacion {
  calcularCuota(
    principal: Dinero,
    tasaMensual: Decimal,
    numeroCuotas: number
  ): Decimal {
    const principalDecimal = new Decimal(
      principal.centavos.toString()
    ).div(100);

    if (tasaMensual.isZero()) {
      return principalDecimal.div(numeroCuotas);
    }

    const factor = tasaMensual
      .plus(1)
      .pow(numeroCuotas);

    return principalDecimal
      .mul(tasaMensual)
      .div(
        new Decimal(1).minus(
          new Decimal(1).div(factor)
        )
      );
  }
}

export class PlanAmortizacion {
  private static readonly estrategia: EstrategiaAmortizacion =
    new EstrategiaFrancesa();

  static generar(
    parametros: ParametrosAmortizacion
  ): Cuota[] {
    const {
      principal,
      tasaMensual,
      numeroCuotas,
    } = parametros;

    if (
      numeroCuotas <= 0 ||
      !Number.isInteger(numeroCuotas)
    ) {
      throw new Error(
        "El número de cuotas debe ser entero y positivo"
      );
    }

    if (tasaMensual < 0) {
      throw new Error(
        "La tasa mensual no puede ser negativa"
      );
    }

    const capitalInicial = principal.centavos;

    if (capitalInicial <= 0n) {
      throw new Error(
        "El principal debe ser positivo"
      );
    }

    const tasa = new Decimal(tasaMensual.toString());

    const cuotaCalculada =
      this.estrategia.calcularCuota(
        principal,
        tasa,
        numeroCuotas
      );

    let saldo = capitalInicial;
    const cuotas: Cuota[] = [];

    for (
      let i = 1;
      i <= numeroCuotas;
      i++
    ) {
      const saldoDecimal = new Decimal(
        saldo.toString()
      ).div(100);

      const interesDecimal = saldoDecimal.mul(tasa);

      const interesCentavos =
        BigInt(
          interesDecimal
            .mul(100)
            .toDecimalPlaces(
              0,
              Decimal.ROUND_HALF_UP
            )
            .toFixed(0)
        );

      let cuotaCentavos =
        BigInt(
          cuotaCalculada
            .mul(100)
            .toDecimalPlaces(
              0,
              Decimal.ROUND_HALF_UP
            )
            .toFixed(0)
        );

      let capitalCentavos =
        cuotaCentavos - interesCentavos;

      /*
       * La última cuota se ajusta para cancelar
       * exactamente todo el saldo restante.
       */
      if (i === numeroCuotas) {
        capitalCentavos = saldo;
        cuotaCentavos =
          capitalCentavos + interesCentavos;
      }

      saldo -= capitalCentavos;

      if (saldo < 0n) {
        saldo = 0n;
      }

      cuotas.push({
        numero: i,
        capital: new Dinero(
          capitalCentavos
        ),
        interes: new Dinero(
          interesCentavos
        ),
        cuota: new Dinero(
          cuotaCentavos
        ),
        saldo: new Dinero(saldo),
      });
    }

    return cuotas;
  }
}