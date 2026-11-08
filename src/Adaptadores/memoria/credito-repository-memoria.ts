
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

  async buscarPorId(
    creditoId: string
  ): Promise<Credito | undefined> {
    return this.creditos.get(creditoId);
  }

  async listarTodos(): Promise<Credito[]> {
    return Array.from(this.creditos.values());
  }

  async guardar(
    credito: Credito
  ): Promise<void> {
    this.creditos.set(
      credito.creditoId,
      credito
    );
  }
}