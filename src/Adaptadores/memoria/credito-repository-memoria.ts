import {
  Credito,
  CreditoRepository,
} from "../../Puertos/credito-repository";

export class CreditoRepositoryMemoria
  implements CreditoRepository
{
  private readonly creditos = new Map<
    string,
    Credito
  >();

  buscarPorId(
    creditoId: string
  ): Credito | undefined {
    return this.creditos.get(creditoId);
  }

  guardar(credito: Credito): void {
    this.creditos.set(
      credito.creditoId,
      credito
    );
  }
}