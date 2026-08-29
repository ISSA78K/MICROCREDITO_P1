import { Dinero } from "../dominio/dinero";
import { DesembolsarCreditoPort } from "../Puertos/casos-uso";
import { CreditoState } from "../dominio/estado-credito";

import {
  Credito,
  CreditoRepository,
} from "../Puertos/credito-repository";

export interface DesembolsarCreditoRequest {
  creditoId: string;
  monto: Dinero;
}

export interface DesembolsarCreditoResponse {
  creditoId: string;
  montoDesembolsado: Dinero;
  estado: string;
}

export class DesembolsarCredito implements DesembolsarCreditoPort {
  constructor(
    private readonly creditoRepository: CreditoRepository
  ) {}

  ejecutar(
    request: DesembolsarCreditoRequest
  ): DesembolsarCreditoResponse {
    const credito =
      this.creditoRepository.buscarPorId(
        request.creditoId
      );

    if (!credito) {
      throw new Error("Crédito no encontrado");
    }

    if (credito.estado !== "aprobado") {
      throw new Error(
        "El crédito debe estar aprobado para ser desembolsado"
      );
    }

    if (request.monto.centavos <= 0n) {
      throw new Error(
        "El monto del desembolso debe ser positivo"
      );
    }

    const estadoActual =
  CreditoState.crear(credito.estado);

const estadoDesembolsado =
  estadoActual.desembolsar();

const estadoVigente =
  CreditoState.crear(
    estadoDesembolsado
  ).desembolsar();

const creditoDesembolsado: Credito = {
  ...credito,
  saldoCapital: request.monto,
  estado: estadoVigente,
};

    this.creditoRepository.guardar(
      creditoDesembolsado
    );

    return {
      creditoId: request.creditoId,
      montoDesembolsado: request.monto,
      estado: "vigente",
    };
  }
}