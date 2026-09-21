import { Dinero } from "../dinero";

export interface TramoPoliticaMora {
  desdeDia: number;
  hastaDia: number | null;
  tasaAnual: number;
}

export interface PoliticaMora {
  readonly id: string;
  readonly fechaVigencia: string;

  obtenerTramos(): readonly TramoPoliticaMora[];

  calcularInteres(
    capitalEnMora: Dinero,
    diasAtraso: number
  ): Dinero;
}