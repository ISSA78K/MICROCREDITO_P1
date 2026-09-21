import { Dinero } from "./dinero";
import { Cuota } from "./plan-amortizacion";

export class CargoCobranza {
  static readonly MONTO =
    Dinero.desdeDecimal("25.00");

  /**
   * El cargo se genera una sola vez cuando
   * la cuota entra en Mora 2 (31 días).
   */
  static corresponde(
    diasAtraso: number,
    cargoYaGenerado: boolean
  ): boolean {
    return (
      diasAtraso >= 31 &&
      !cargoYaGenerado
    );
  }

  static generar(): Dinero {
    return this.MONTO;
  }

  static calcular(
    diasAtraso: number,
    cargoYaGenerado: boolean
  ): Dinero {
    return this.corresponde(
      diasAtraso,
      cargoYaGenerado
    )
      ? this.generar()
      : Dinero.cero();
  }

    static calcularParaCuota(
    cuota: Cuota
  ): Dinero {
    return this.calcular(
      cuota.diasAtraso,
      cuota.cargoCobranzaGenerado
    );
  }
}