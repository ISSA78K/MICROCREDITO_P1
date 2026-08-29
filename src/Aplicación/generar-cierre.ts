import { GenerarCierrePort } from "../Puertos/casos-uso";
import {
  Cartera,
  CreditoCartera,
} from "../dominio/cartera";

export interface GenerarCierreRequest {
  fechaCorte: string;
  creditos: CreditoCartera[];
}

export interface GenerarCierreResponse {
  fechaCorte: string;
  carteraActiva: ReturnType<
    typeof Cartera.calcular
  >["carteraActiva"];
  saldoEnRiesgo: ReturnType<
    typeof Cartera.calcular
  >["saldoEnRiesgo"];
  porcentajeEnRiesgo: number;
  dadoPorIncobrableEnElPeriodo: ReturnType<
    typeof Cartera.calcular
  >["dadoPorIncobrableEnElPeriodo"];
}

export class GenerarCierre implements GenerarCierrePort {
  ejecutar(
    request: GenerarCierreRequest
  ): GenerarCierreResponse {
    const resultado =
      Cartera.calcular(
        request.creditos
      );

    return {
      fechaCorte:
        request.fechaCorte,

      carteraActiva:
        resultado.carteraActiva,

      saldoEnRiesgo:
        resultado.saldoEnRiesgo,

      porcentajeEnRiesgo:
        resultado.porcentajeEnRiesgo,

      dadoPorIncobrableEnElPeriodo:
        resultado.dadoPorIncobrableEnElPeriodo,
    };
  }
}