import { z } from "zod";

export const RegistrarPagoRequestSchema = z.object({
  creditoId: z.string(),

  monto: z
    .string()
    .regex(
      /^\d{1,13}\.\d{2}$/,
      "El monto debe tener exactamente 2 decimales"
    ),

  saldos: z.object({
    gastos: z
      .string()
      .regex(/^\d{1,13}\.\d{2}$/),

    interesMoratorio: z
      .string()
      .regex(/^\d{1,13}\.\d{2}$/),

    interesCorriente: z
      .string()
      .regex(/^\d{1,13}\.\d{2}$/),

    capital: z
      .string()
      .regex(/^\d{1,13}\.\d{2}$/),
  }),
});

export const RegistrarPagoResponseSchema = z.object({
  pagoId: z.string(),

  creditoId: z.string(),

  montoRecibido: z.string(),

  reproducido: z.boolean(),

  aplicacion: z.object({
    gastos: z.string(),
    interesMoratorio: z.string(),
    interesCorriente: z.string(),
    capital: z.string(),
    excedente: z.string(),
  }),
});

export const ConsultarCarteraQuerySchema = z.object({
  fechaCorte: z
    .string()
    .regex(
      /^\d{4}-\d{2}-\d{2}$/,
      "Formato AAAA-MM-DD"
    ),

  incluirReestructurados:
    z.boolean().optional(),
});

export const ConsultarCarteraResponseSchema = z.object({
  fechaCorte: z.string(),

  carteraActiva: z.string(),

  saldoEnRiesgo: z.string(),

  porcentajeEnRiesgo: z
  .number()
  .min(0)
  .max(100),

  dadoPorIncobrableEnElPeriodo:
    z.string(),

  porTramo: z.record(
    z.string(),
    z.string()
  ),
});

export const ProblemDetailsSchema = z.object({
  type: z.string(),

  title: z.string(),

  status: z
    .number()
    .int()
    .min(400)
    .max(599),

  detail: z.string().optional(),

  instance: z.string().optional(),

  traceId: z.string().optional(),

  errores: z
    .array(
      z.object({
        campo: z.string(),
        mensaje: z.string(),
      })
    )
    .optional(),
});