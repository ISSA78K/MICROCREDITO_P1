import { pool } from "./conexion";
import type { PoolClient } from "pg";
import type { RegistrarPagoResponse } from "../../Aplicación/registrar-pago";
import { Dinero } from "../../dominio/dinero";

type RespuestaPagoJSON = {
  pagoId: string;
  creditoId: string;
  montoRecibido: string;
  aplicacion: {
    gastos: string;
    interesMoratorio: string;
    interesCorriente: string;
    capital: string;
    excedente: string;
  };
  reproducido: boolean;
};

function serializarRespuesta(
  respuesta: RegistrarPagoResponse
): RespuestaPagoJSON {
  return {
    pagoId: respuesta.pagoId,
    creditoId: respuesta.creditoId,
    montoRecibido: respuesta.montoRecibido.toDecimal(),
    aplicacion: {
      gastos: respuesta.aplicacion.gastos.toDecimal(),
      interesMoratorio: respuesta.aplicacion.interesMoratorio.toDecimal(),
      interesCorriente: respuesta.aplicacion.interesCorriente.toDecimal(),
      capital: respuesta.aplicacion.capital.toDecimal(),
      excedente: respuesta.aplicacion.excedente.toDecimal(),
    },
    reproducido: respuesta.reproducido,
  };
}

function reconstruirRespuesta(
  respuesta: RespuestaPagoJSON
): RegistrarPagoResponse {
  return {
    pagoId: respuesta.pagoId,
    creditoId: respuesta.creditoId,
    montoRecibido: Dinero.desdeDecimal(respuesta.montoRecibido),
    aplicacion: {
      gastos: Dinero.desdeDecimal(respuesta.aplicacion.gastos),
      interesMoratorio: Dinero.desdeDecimal(respuesta.aplicacion.interesMoratorio),
      interesCorriente: Dinero.desdeDecimal(respuesta.aplicacion.interesCorriente),
      capital: Dinero.desdeDecimal(respuesta.aplicacion.capital),
      excedente: Dinero.desdeDecimal(respuesta.aplicacion.excedente),
    },
    reproducido: respuesta.reproducido,
  };
}

export interface PagoPostgres {
  claveIdempotencia: string;
  creditoId: string;
  fechaPago: string;
  montoCentavos: bigint;
  canal: string;
}

export class PagoRepositoryPostgres {
  async buscarRespuesta(
    claveIdempotencia: string,
    cliente?: PoolClient
  ): Promise<RegistrarPagoResponse | null> {
    const ejecutor = cliente ?? pool;

    const resultado = await ejecutor.query(
      `SELECT respuesta_json
       FROM pagos
       WHERE clave_idempotencia = $1`,
      [claveIdempotencia]
    );

    if (resultado.rowCount !== 1) {
      return null;
    }

    const respuesta = resultado.rows[0].respuesta_json;

    if (!respuesta) {
      return null;
    }

    return reconstruirRespuesta(
      respuesta as RespuestaPagoJSON
    );
  }

  async registrar(
    pago: PagoPostgres,
    respuesta: RegistrarPagoResponse,
    cliente?: PoolClient
  ): Promise<boolean> {
    const ejecutor = cliente ?? pool;

    const resultado = await ejecutor.query(
      `INSERT INTO pagos (
        clave_idempotencia,
        id_credito,
        fecha_pago,
        monto_centavos,
        canal,
        respuesta_json
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (clave_idempotencia) DO NOTHING
      RETURNING clave_idempotencia`,
      [
        pago.claveIdempotencia,
        pago.creditoId,
        pago.fechaPago,
        pago.montoCentavos.toString(),
        pago.canal,
        JSON.stringify(serializarRespuesta(respuesta)),
      ]
    );

    return resultado.rowCount === 1;
  }
}