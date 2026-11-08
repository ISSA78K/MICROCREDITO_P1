import { Dinero } from "../dominio/dinero";
import { EstadoCredito } from "../dominio/estado-credito";
import {
  PrelacionPago,
  SaldosPendientes,
} from "../dominio/prelacion-pago";
import { CreditoRepository } from "../Puertos/credito-repository";
import { RegistrarPagoPort } from "../Puertos/casos-uso";
import { CargoCobranza } from "../dominio/cargo-cobranza";
import { CreditoRepositoryPostgres } from "../Adaptadores/postgres/credito-repository-postgres";
import { PagoRepositoryPostgres } from "../Adaptadores/postgres/pago-repository-postgres";
import { ejecutarTransaccion } from "../Adaptadores/postgres/conexion";

export interface RegistrarPagoRequest {
  creditoId: string;
  pagoId: string;
  monto: Dinero;
  saldos: SaldosPendientes;
}

export interface RegistrarPagoResponse {
  pagoId: string;
  creditoId: string;
  montoRecibido: Dinero;
  aplicacion: {
    gastos: Dinero;
    interesMoratorio: Dinero;
    interesCorriente: Dinero;
    capital: Dinero;
    excedente: Dinero;
  };
  reproducido: boolean;
}

export class RegistrarPago implements RegistrarPagoPort {
  private readonly pagos = new Map<
    string,
    RegistrarPagoResponse
  >();

  constructor(
    private readonly creditoRepository: CreditoRepository,
    private readonly persistenciaPostgres?: {
      credito: CreditoRepositoryPostgres;
      pago: PagoRepositoryPostgres;
    }
  ) {}

  async ejecutar(
    request: RegistrarPagoRequest
  ): Promise<RegistrarPagoResponse> {
    if (this.persistenciaPostgres) {
      return this.ejecutarConPostgres(request);
    }
    const anterior = this.pagos.get(request.pagoId);

    if (anterior) {
      return {
        ...anterior,
        reproducido: true,
      };
    }

    const credito = await this.creditoRepository.buscarPorId(
      request.creditoId
    );

    if (!credito) {
      throw new Error("Crédito no encontrado");
    }

    if (credito.estado === "cancelado") {
      throw new Error(
        "No se puede registrar un pago para un crédito cancelado"
      );
    }

    const interesEnSuspenso =
      credito.interesEnSuspenso ?? Dinero.cero();

    const interesCorrienteConSuspenso =
      request.saldos.interesCorriente.sumar(
        interesEnSuspenso
      );

    const cargoCobranza = CargoCobranza.calcular(
      credito.diasAtraso ?? 0,
      credito.cargoCobranzaGenerado ?? false
    );

    const gastosConCargo =
      request.saldos.gastos.sumar(cargoCobranza);

    const saldosEfectivos: SaldosPendientes = {
      ...request.saldos,
      gastos: gastosConCargo,
      interesCorriente: interesCorrienteConSuspenso,
    };

    const aplicacion = PrelacionPago.aplicar(
      request.monto,
      saldosEfectivos
    );

    const saldoRestante = credito.saldoCapital.restar(
      aplicacion.capital
    );

    const conceptosVencidosCubiertos =
      aplicacion.gastos.centavos >=
        saldosEfectivos.gastos.centavos &&
      aplicacion.interesMoratorio.centavos >=
        saldosEfectivos.interesMoratorio.centavos &&
      aplicacion.interesCorriente.centavos >=
        saldosEfectivos.interesCorriente.centavos;

    const estadoNuevo: EstadoCredito =
      saldoRestante.esCero()
        ? "cancelado"
        : credito.estado === "en_mora"
          ? conceptosVencidosCubiertos
            ? "vigente"
            : "en_mora"
          : credito.estado;

    await this.creditoRepository.guardar({
      ...credito,
      saldoCapital: saldoRestante,
      estado: estadoNuevo,
      cargoCobranzaGenerado:
        (credito.cargoCobranzaGenerado ?? false) ||
        !cargoCobranza.esCero(),
      interesEnSuspenso:
        interesEnSuspenso.esPositivo()
          ? interesEnSuspenso.restar(
              this.calcularSuspensoReconocido(
                interesEnSuspenso,
                request.saldos.interesCorriente,
                aplicacion.interesCorriente
              )
            )
          : Dinero.cero(),
    });

    const respuesta: RegistrarPagoResponse = {
      pagoId: request.pagoId,
      creditoId: request.creditoId,
      montoRecibido: request.monto,
      aplicacion,
      reproducido: false,
    };

    this.pagos.set(request.pagoId, respuesta);

    return respuesta;
  }

  private async ejecutarConPostgres(
    request: RegistrarPagoRequest
  ): Promise<RegistrarPagoResponse> {
    const persistencia = this.persistenciaPostgres;

    if (!persistencia) {
      throw new Error("La persistencia PostgreSQL no está configurada");
    }

    return ejecutarTransaccion(async (cliente) => {
      const anterior = await persistencia.pago.buscarRespuesta(
        request.pagoId,
        cliente
      );

      if (anterior) {
        return { ...anterior, reproducido: true };
      }

      const credito = await persistencia.credito.buscarPorIdEnTransaccion(
        request.creditoId,
        cliente
      );

      if (!credito) {
        throw new Error("Crédito no encontrado");
      }

      if (credito.estado === "cancelado") {
        throw new Error(
          "No se puede registrar un pago para un crédito cancelado"
        );
      }

      const interesEnSuspenso =
        credito.interesEnSuspenso ?? Dinero.cero();

      const interesCorrienteConSuspenso =
        request.saldos.interesCorriente.sumar(interesEnSuspenso);

      const cargoCobranza = CargoCobranza.calcular(
        credito.diasAtraso ?? 0,
        credito.cargoCobranzaGenerado ?? false
      );

      const gastosConCargo = request.saldos.gastos.sumar(cargoCobranza);

      const saldosEfectivos: SaldosPendientes = {
        ...request.saldos,
        gastos: gastosConCargo,
        interesCorriente: interesCorrienteConSuspenso,
      };

      const aplicacion = PrelacionPago.aplicar(
        request.monto,
        saldosEfectivos
      );

      const saldoRestante = credito.saldoCapital.restar(
        aplicacion.capital
      );

      const conceptosVencidosCubiertos =
        aplicacion.gastos.centavos >= saldosEfectivos.gastos.centavos &&
        aplicacion.interesMoratorio.centavos >=
          saldosEfectivos.interesMoratorio.centavos &&
        aplicacion.interesCorriente.centavos >=
          saldosEfectivos.interesCorriente.centavos;

      const estadoNuevo: EstadoCredito =
        saldoRestante.esCero()
          ? "cancelado"
          : credito.estado === "en_mora"
            ? conceptosVencidosCubiertos
              ? "vigente"
              : "en_mora"
            : credito.estado;

      const creditoActualizado = {
        ...credito,
        saldoCapital: saldoRestante,
        estado: estadoNuevo,
        cargoCobranzaGenerado:
          (credito.cargoCobranzaGenerado ?? false) ||
          !cargoCobranza.esCero(),
        interesEnSuspenso:
          interesEnSuspenso.esPositivo()
            ? interesEnSuspenso.restar(
                this.calcularSuspensoReconocido(
                  interesEnSuspenso,
                  request.saldos.interesCorriente,
                  aplicacion.interesCorriente
                )
              )
            : Dinero.cero(),
      };

      const respuesta: RegistrarPagoResponse = {
        pagoId: request.pagoId,
        creditoId: request.creditoId,
        montoRecibido: request.monto,
        aplicacion,
        reproducido: false,
      };

      await persistencia.credito.guardarEnTransaccion(
        creditoActualizado,
        cliente
      );

      const registrado = await persistencia.pago.registrar(
        {
          claveIdempotencia: request.pagoId,
          creditoId: request.creditoId,
          fechaPago: new Date().toISOString().slice(0, 10),
          montoCentavos: request.monto.centavos,
          canal: "API",
        },
        respuesta,
        cliente
      );

      if (!registrado) {
        const respuestaAnterior = await persistencia.pago.buscarRespuesta(
          request.pagoId,
          cliente
        );

        if (respuestaAnterior) {
          return { ...respuestaAnterior, reproducido: true };
        }

        throw new Error("No fue posible registrar el pago");
      }

      return respuesta;
    });
  }
  private calcularSuspensoReconocido(
    interesEnSuspenso: Dinero,
    interesCorrienteOriginal: Dinero,
    interesCorrienteAplicado: Dinero
  ): Dinero {
    const interesCorrientePagado =
      interesCorrienteAplicado.centavos <=
      interesCorrienteOriginal.centavos
        ? interesCorrienteAplicado
        : interesCorrienteOriginal;

    const reconocido =
      interesCorrienteAplicado.restar(
        interesCorrientePagado
      );

    return reconocido.centavos >=
      interesEnSuspenso.centavos
      ? interesEnSuspenso
      : reconocido;
  }
}