export type Moneda = "GTQ";

export class Dinero {
  public readonly centavos: bigint;
  public readonly moneda: Moneda;

  constructor(centavos: bigint, moneda: Moneda = "GTQ") {
    if (moneda !== "GTQ") {
      throw new Error("La moneda debe ser GTQ");
    }

    this.centavos = centavos;
    this.moneda = moneda;
  }

  static desdeDecimal(valor: string): Dinero {
    if (!/^-?\d{1,13}\.\d{2}$/.test(valor)) {
      throw new Error(
        "El importe debe tener exactamente dos decimales"
      );
    }

    const negativo = valor.startsWith("-");
    const limpio = negativo ? valor.slice(1) : valor;

    const [entero, decimales] = limpio.split(".");

    let centavos =
      BigInt(entero) * 100n +
      BigInt(decimales);

    if (negativo) {
      centavos = -centavos;
    }

    return new Dinero(centavos);
  }

  static cero(): Dinero {
    return new Dinero(0n);
  }

  sumar(otro: Dinero): Dinero {
    this.validarMoneda(otro);

    return new Dinero(
      this.centavos + otro.centavos
    );
  }

  restar(otro: Dinero): Dinero {
    this.validarMoneda(otro);

    return new Dinero(
      this.centavos - otro.centavos
    );
  }

  esCero(): boolean {
    return this.centavos === 0n;
  }

  esPositivo(): boolean {
    return this.centavos > 0n;
  }

  toDecimal(): string {
    const negativo = this.centavos < 0n;

    const absoluto = negativo
      ? -this.centavos
      : this.centavos;

    const entero = absoluto / 100n;

    const decimales = (absoluto % 100n)
      .toString()
      .padStart(2, "0");

    return `${negativo ? "-" : ""}${entero}.${decimales}`;
  }

  private validarMoneda(otro: Dinero): void {
    if (this.moneda !== otro.moneda) {
      throw new Error(
        "No se pueden operar monedas diferentes"
      );
    }
  }
}