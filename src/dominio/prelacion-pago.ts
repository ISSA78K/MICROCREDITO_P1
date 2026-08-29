import { Dinero } from "./dinero";

export interface SaldosPendientes {
  gastos: Dinero;
  interesMoratorio: Dinero;
  interesCorriente: Dinero;
  capital: Dinero;
}

export interface AplicacionPago {
  gastos: Dinero;
  interesMoratorio: Dinero;
  interesCorriente: Dinero;
  capital: Dinero;
  excedente: Dinero;
}

export class PrelacionPago {
  static aplicar(
    pago: Dinero,
    saldos: SaldosPendientes
  ): AplicacionPago {
    let restante = pago;

    const gastos = this.aplicarConcepto(
      restante,
      saldos.gastos
    );

    restante = restante.restar(gastos);

    const interesMoratorio =
      this.aplicarConcepto(
        restante,
        saldos.interesMoratorio
      );

    restante = restante.restar(interesMoratorio);

    const interesCorriente =
      this.aplicarConcepto(
        restante,
        saldos.interesCorriente
      );

    restante = restante.restar(interesCorriente);

    const capital =
      this.aplicarConcepto(
        restante,
        saldos.capital
      );

    restante = restante.restar(capital);

    return {
      gastos,
      interesMoratorio,
      interesCorriente,
      capital,
      excedente: restante,
    };
  }

  private static aplicarConcepto(
    pago: Dinero,
    saldo: Dinero
  ): Dinero {
    if (pago.centavos <= 0n || saldo.centavos <= 0n) {
      return Dinero.cero();
    }

    return pago.centavos <= saldo.centavos
      ? pago
      : saldo;
  }
}