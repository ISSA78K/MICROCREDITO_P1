import { Dinero } from "../dominio/dinero";
import { EstadoCredito } from "../dominio/estado-credito";

export interface Credito {
  creditoId: string;
  clienteId: string;
  saldoCapital: Dinero;
  estado: EstadoCredito;
}

export interface CreditoRepository {
  buscarPorId(
    creditoId: string
  ): Credito | undefined;

  guardar(
    credito: Credito
  ): void;
}