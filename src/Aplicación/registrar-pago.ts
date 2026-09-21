import { Dinero } from "../dominio/dinero";
import { EstadoCredito } from "../dominio/estado-credito";
import { PrelacionPago, SaldosPendientes } from "../dominio/prelacion-pago";
import { CreditoRepository } from "../Puertos/credito-repository";
import { RegistrarPagoPort } from "../Puertos/casos-uso";
import { CargoCobranza } from "../dominio/cargo-cobranza";

export interface RegistrarPagoRequest {
  creditoId: string;
  pagoId: string;
  monto: Dinero;
  saldos: SaldosPendientes;
}

export interface RegistrarPagoResponse {
  pagoId: string;
  creditoId: string;
  montoRecibido: Dinero;
  aplicacion: {
    gastos: Dinero;
    interesMoratorio: Dinero;
    interesCorriente: Dinero;
    capital: Dinero;
    excedente: Dinero;
  };
  reproducido: boolean;
}

export class RegistrarPago implements RegistrarPagoPort {
  private readonly pagos = new Map<
    string,
    RegistrarPagoResponse
  >();

  constructor(
    private readonly creditoRepository: CreditoRepository
  ) {}

  ejecutar(
    request: RegistrarPagoRequest
  ): RegistrarPagoResponse {
    const anterior = this.pagos.get(request.pagoId);

    if (anterior) {
      return {
        ...anterior,
        reproducido: true,
      };
    }

    const credito =
      this.creditoRepository.buscarPorId(
        request.creditoId
      );

    if (!credito) {
      throw new Error("Crédito no encontrado");
    }

    if (credito.estado === "cancelado") {
      throw new Error(
        "No se puede registrar un pago para un crédito cancelado"
      );
    }

    const interesEnSuspenso =
      credito.interesEnSuspenso ?? Dinero.cero();

    const interesCorrienteConSuspenso =
  request.saldos.interesCorriente.sumar(
    interesEnSuspenso
  );

const cargoCobranza =
  CargoCobranza.calcular(
    credito.diasAtraso ?? 0,
    credito.cargoCobranzaGenerado ?? false
  );

const gastosConCargo =
  request.saldos.gastos.sumar(
    cargoCobranza
  );

const saldosEfectivos: SaldosPendientes = {
  ...request.saldos,
  gastos: gastosConCargo,
  interesCorriente:
    interesCorrienteConSuspenso,
};

    const aplicacion =
      PrelacionPago.aplicar(
        request.monto,
        saldosEfectivos
      );

    const saldoRestante =
      credito.saldoCapital.restar(
        aplicacion.capital
      );

    const estadoNuevo: EstadoCredito =
      credito.estado === "en_mora"
        ? saldoRestante.esCero()
          ? "cancelado"
          : "vigente"
        : credito.estado;

    this.creditoRepository.guardar({
      ...credito,
      saldoCapital: saldoRestante,
      estado: estadoNuevo,
      cargoCobranzaGenerado:
        (credito.cargoCobranzaGenerado ?? false) ||
        !cargoCobranza.esCero(),
      interesEnSuspenso:
        credito.interesEnSuspenso.esPositivo()
          ? credito.interesEnSuspenso.restar(
              this.calcularSuspensoReconocido(
                credito.interesEnSuspenso,
                request.saldos.interesCorriente,
                aplicacion.interesCorriente
              )
            )
          : Dinero.cero(),
    });

    const respuesta: RegistrarPagoResponse = {
      pagoId: request.pagoId,
      creditoId: request.creditoId,
      montoRecibido: request.monto,
      aplicacion,
      reproducido: false,
    };

    this.pagos.set(
      request.pagoId,
      respuesta
    );

    return respuesta;
  }

  private calcularSuspensoReconocido(
    interesEnSuspenso: Dinero,
    interesCorrienteOriginal: Dinero,
    interesCorrienteAplicado: Dinero
  ): Dinero {
    const interesCorrientePagado =
      interesCorrienteAplicado.centavos <=
      interesCorrienteOriginal.centavos
        ? interesCorrienteAplicado
        : interesCorrienteOriginal;

    const reconocido =
      interesCorrienteAplicado.restar(
        interesCorrientePagado
      );

    return reconocido.centavos >=
      interesEnSuspenso.centavos
      ? interesEnSuspenso
      : reconocido;
  }
}