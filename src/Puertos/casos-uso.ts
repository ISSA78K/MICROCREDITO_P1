import {
  RegistrarPagoRequest,
  RegistrarPagoResponse,
} from "../Aplicación/registrar-pago";

import {
  DesembolsarCreditoRequest,
  DesembolsarCreditoResponse,
} from "../Aplicación/desembolsar-credito";

import {
  ConsultarCarteraRequest,
  ConsultarCarteraResponse,
} from "../Aplicación/consultar-cartera";

import {
  GenerarCierreRequest,
  GenerarCierreResponse,
} from "../Aplicación/generar-cierre";

/**
 * Puerto de entrada para registrar pagos.
 */
export interface RegistrarPagoPort {
  ejecutar(
    request: RegistrarPagoRequest
  ): RegistrarPagoResponse;
}

/**
 * Puerto de entrada para desembolsar créditos.
 */
export interface DesembolsarCreditoPort {
  ejecutar(
    request: DesembolsarCreditoRequest
  ): DesembolsarCreditoResponse;
}

/**
 * Puerto de entrada para consultar la cartera.
 */
export interface ConsultarCarteraPort {
  ejecutar(
    request: ConsultarCarteraRequest
  ): ConsultarCarteraResponse;
}

/**
 * Puerto de entrada para generar el cierre.
 */
export interface GenerarCierrePort {
  ejecutar(
    request: GenerarCierreRequest
  ): GenerarCierreResponse;
}