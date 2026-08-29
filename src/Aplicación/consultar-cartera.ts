import { ConsultarCarteraPort } from "../Puertos/casos-uso";

import {
  Cartera,
  CreditoCartera,
} from "../dominio/cartera";

export interface ConsultarCarteraRequest {
  fechaCorte: string;
  creditos: CreditoCartera[];
}

export interface ConsultarCarteraResponse {
  fechaCorte: string;
  carteraActiva: ReturnType<
    typeof Cartera.calcular
  >["carteraActiva"];
  saldoEnRiesgo: ReturnType<
    typeof Cartera.calcular
  >["saldoEnRiesgo"];
  porcentajeEnRiesgo: number;
  porTramo: ReturnType<
    typeof Cartera.calcular
  >["porTramo"];
  dadoPorIncobrableEnElPeriodo: ReturnType<
    typeof Cartera.calcular
  >["dadoPorIncobrableEnElPeriodo"];
}

export class ConsultarCartera implements ConsultarCarteraPort {
  ejecutar(
    request: ConsultarCarteraRequest
  ): ConsultarCarteraResponse {
    const resultado = Cartera.calcular(
      request.creditos
    );

    return {
      fechaCorte: request.fechaCorte,

      carteraActiva:
        resultado.carteraActiva,

      saldoEnRiesgo:
        resultado.saldoEnRiesgo,

      porcentajeEnRiesgo:
        resultado.porcentajeEnRiesgo,

      porTramo:
        resultado.porTramo,

      dadoPorIncobrableEnElPeriodo:
        resultado.dadoPorIncobrableEnElPeriodo,
    };
  }
}