import {
  describe,
  expect,
  it,
} from "vitest";

import {
  RegistrarPagoRequestSchema,
  RegistrarPagoResponseSchema,
  ConsultarCarteraQuerySchema,
  ConsultarCarteraResponseSchema,
  ProblemDetailsSchema,
} from "../src/Contrato/schemas";

describe("Contrato Zod", () => {
  it("valida una petición de pago correcta", () => {
    const resultado =
      RegistrarPagoRequestSchema.safeParse({
        creditoId: "C-001",

        monto: "100.00",

        saldos: {
          gastos: "10.00",
          interesMoratorio: "20.00",
          interesCorriente: "30.00",
          capital: "40.00",
        },
      });

    expect(resultado.success).toBe(true);
  });

  it("rechaza dinero sin dos decimales", () => {
    const resultado =
      RegistrarPagoRequestSchema.safeParse({
        creditoId: "C-001",

        monto: "100",

        saldos: {
          gastos: "10.00",
          interesMoratorio: "20.00",
          interesCorriente: "30.00",
          capital: "40.00",
        },
      });

    expect(resultado.success).toBe(false);
  });

  it("valida una respuesta de pago", () => {
    const resultado =
      RegistrarPagoResponseSchema.safeParse({
        pagoId: "PG-001",
        creditoId: "C-001",
        montoRecibido: "100.00",
        reproducido: false,

        aplicacion: {
          gastos: "10.00",
          interesMoratorio: "20.00",
          interesCorriente: "30.00",
          capital: "40.00",
          excedente: "0.00",
        },
      });

    expect(resultado.success).toBe(true);
  });

  it("valida la consulta de cartera", () => {
    const resultado =
      ConsultarCarteraQuerySchema.safeParse({
        fechaCorte: "2026-08-22",
        incluirReestructurados: false,
      });

    expect(resultado.success).toBe(true);
  });

  it("rechaza una fecha de corte inválida", () => {
    const resultado =
      ConsultarCarteraQuerySchema.safeParse({
        fechaCorte: "22-08-2026",
      });

    expect(resultado.success).toBe(false);
  });

  it("valida ProblemDetails", () => {
    const resultado =
      ProblemDetailsSchema.safeParse({
        type:
          "https://api.creditovecino.gt/problemas/validacion",

        title: "Solicitud inválida",

        status: 422,

        detail:
          "Uno o más campos son inválidos.",
      });

    expect(resultado.success).toBe(true);
  });

  it("valida la respuesta de cartera", () => {
    const resultado =
      ConsultarCarteraResponseSchema.safeParse({
        fechaCorte: "2026-08-22",

        carteraActiva: "1500.00",

        saldoEnRiesgo: "500.00",

        porcentajeEnRiesgo: 0.33,

        dadoPorIncobrableEnElPeriodo:
          "0.00",

        porTramo: {
          mora_1: "500.00",
        },
      });

    expect(resultado.success).toBe(true);
  });
});