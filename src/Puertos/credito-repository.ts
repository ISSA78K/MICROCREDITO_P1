
import { Dinero } from "../dominio/dinero";
import { EstadoCredito } from "../dominio/estado-credito";

export interface Credito {
  creditoId: string;
  clienteId: string;
  saldoCapital: Dinero;
  estado: EstadoCredito;
  fechaDesembolso: string;
  politicaMoraId: string;
  interesEnSuspenso: Dinero;
  diasAtraso?: number;
  cargoCobranzaGenerado?: boolean;
}

export interface CreditoRepository {
  buscarPorId(
    creditoId: string
  ): Promise<Credito | undefined>;

  listarTodos(): Promise<Credito[]>;

  guardar(
    credito: Credito
  ): Promise<void>;
}