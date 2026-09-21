export type EstadoCredito =
  | "solicitado"
  | "aprobado"
  | "desembolsado"
  | "vigente"
  | "en_mora"
  | "reestructurado"
  | "rechazado"
  | "anulado"
  | "cancelado"
  | "incobrable";

export type ResultadoTransicion =
  | "aprobado"
  | "rechazado"
  | "desembolsado"
  | "vigente"
  | "en_mora"
  | "reestructurado"
  | "cancelado"
  | "incobrable"
  | "anulado";

export interface EstadoCreditoState {
  readonly nombre: EstadoCredito;

  aprobar(): ResultadoTransicion;
  rechazar(): ResultadoTransicion;
  desembolsar(): ResultadoTransicion;
  entrarEnMora(): ResultadoTransicion;
  regularizar(): ResultadoTransicion;
  reestructurar(): ResultadoTransicion;
  declararIncobrable(): ResultadoTransicion;
  cancelar(): ResultadoTransicion;
  pagar(): never;
}

abstract class EstadoBase
  implements EstadoCreditoState
{
    pagar(): never {
  throw new Error(
    `Transición inválida desde ${this.nombre}: pagar`
  );
}
  abstract readonly nombre: EstadoCredito;

  aprobar(): ResultadoTransicion {
    throw new Error(
      `Transición inválida desde ${this.nombre}: aprobar`
    );
  }

  rechazar(): ResultadoTransicion {
    throw new Error(
      `Transición inválida desde ${this.nombre}: rechazar`
    );
  }

  desembolsar(): ResultadoTransicion {
    throw new Error(
      `Transición inválida desde ${this.nombre}: desembolsar`
    );
  }

  entrarEnMora(): ResultadoTransicion {
    throw new Error(
      `Transición inválida desde ${this.nombre}: entrarEnMora`
    );
  }

  regularizar(): ResultadoTransicion {
    throw new Error(
      `Transición inválida desde ${this.nombre}: regularizar`
    );
  }

  reestructurar(): ResultadoTransicion {
    throw new Error(
      `Transición inválida desde ${this.nombre}: reestructurar`
    );
  }

  declararIncobrable(): ResultadoTransicion {
    throw new Error(
      `Transición inválida desde ${this.nombre}: declararIncobrable`
    );
  }

  cancelar(): ResultadoTransicion {
    throw new Error(
      `Transición inválida desde ${this.nombre}: cancelar`
    );
  }
}

class EstadoSolicitado extends EstadoBase {
  readonly nombre = "solicitado" as const;

  override aprobar(): "aprobado" {
    return "aprobado";
  }

  override rechazar(): "rechazado" {
    return "rechazado";
  }
}

class EstadoAprobado extends EstadoBase {
  readonly nombre = "aprobado" as const;

  override desembolsar(): "desembolsado" {
    return "desembolsado";
  }

  override cancelar(): "anulado" {
    return "anulado";
  }
}

class EstadoDesembolsado extends EstadoBase {
  readonly nombre = "desembolsado" as const;

  override desembolsar(): "vigente" {
    return "vigente";
  }
}

class EstadoVigente extends EstadoBase {
  readonly nombre = "vigente" as const;

  override entrarEnMora(): "en_mora" {
    return "en_mora";
  }

  override cancelar(): "cancelado" {
    return "cancelado";
  }
}

class EstadoEnMora extends EstadoBase {
  readonly nombre = "en_mora" as const;

  override regularizar(): "vigente" {
    return "vigente";
  }

  override reestructurar(): "reestructurado" {
    return "reestructurado";
  }

  override declararIncobrable(): "incobrable" {
    return "incobrable";
  }

    override cancelar(): "cancelado" {
    return "cancelado";
  }
}


class EstadoReestructurado extends EstadoBase {
  readonly nombre = "reestructurado" as const;

  override entrarEnMora(): "en_mora" {
    return "en_mora";
  }

  override regularizar(): "vigente" {
    return "vigente";
  }

  override cancelar(): "cancelado" {
    return "cancelado";
  }
}

class EstadoRechazado extends EstadoBase {
  readonly nombre = "rechazado" as const;
}

class EstadoAnulado extends EstadoBase {
  readonly nombre = "anulado" as const;
}

class EstadoCancelado extends EstadoBase {
  readonly nombre = "cancelado" as const;
}

class EstadoIncobrable extends EstadoBase {
  readonly nombre = "incobrable" as const;
}

export class CreditoState {
  static crear(
    estado: EstadoCredito
  ): EstadoCreditoState {
    switch (estado) {
      case "solicitado":
        return new EstadoSolicitado();

      case "aprobado":
        return new EstadoAprobado();

      case "desembolsado":
        return new EstadoDesembolsado();

      case "vigente":
        return new EstadoVigente();

      case "en_mora":
        return new EstadoEnMora();

      case "reestructurado":
        return new EstadoReestructurado();

      case "rechazado":
        return new EstadoRechazado();

      case "anulado":
        return new EstadoAnulado();

      case "cancelado":
        return new EstadoCancelado();

      case "incobrable":
        return new EstadoIncobrable();
    }
  }
}