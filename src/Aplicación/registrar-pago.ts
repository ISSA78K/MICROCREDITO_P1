import { Dinero } from "../dominio/dinero";
import { PrelacionPago, SaldosPendientes } from "../dominio/prelacion-pago";
import { CreditoRepository } from "../Puertos/credito-repository";
import { RegistrarPagoPort } from "../Puertos/casos-uso";

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

    const aplicacion =
      PrelacionPago.aplicar(
        request.monto,
        request.saldos
      );

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
}