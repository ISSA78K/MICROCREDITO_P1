import { PoliticaMora } from "./politica-mora";
import { PoliticaPlana } from "./politica-plana";
import { PoliticaEscalonada } from "./politica-escalonada";

export class SelectorPoliticaMora {
  private readonly politicaPlana =
    new PoliticaPlana();

  private readonly politicaEscalonada =
    new PoliticaEscalonada();

  seleccionar(
    fechaDesembolso: string
  ): PoliticaMora {
    if (fechaDesembolso < "2026-10-01") {
      return this.politicaPlana;
    }

    return this.politicaEscalonada;
  }
}