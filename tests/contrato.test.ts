import { Dinero } from "../src/dominio/dinero";
import { PoliticaMora } from "../src/dominio/politica-mora/politica-mora";
import { PoliticaPlana } from "../src/dominio/politica-mora/politica-plana";
import { PoliticaEscalonada } from "../src/dominio/politica-mora/politica-escalonada";
import { PoliticaRetroactiva } from "../src/dominio/politica-mora/politica-retroactiva";

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

    it("cumple el contrato de PoliticaMora para las políticas disponibles", () => {
    const politicas: PoliticaMora[] = [
      new PoliticaPlana(),
      new PoliticaEscalonada(),
      new PoliticaRetroactiva(),
    ];

    const capital = Dinero.desdeDecimal("725.76");

    for (const politica of politicas) {
      expect(politica.id).toBeTruthy();
      expect(politica.fechaVigencia).toMatch(
        /^\d{4}-\d{2}-\d{2}$/
      );

      const tramos = politica.obtenerTramos();

      expect(tramos.length).toBeGreaterThan(0);

      for (const tramo of tramos) {
        expect(tramo.desdeDia).toBeGreaterThan(0);
        expect(tramo.tasaAnual).toBeGreaterThan(0);
      }

      const resultadoCero =
        politica.calcularInteres(
          capital,
          0
        );

      expect(
        resultadoCero.toDecimal()
      ).toBe("0.00");

      const resultado =
        politica.calcularInteres(
          capital,
          15
        );

      expect(resultado).toBeInstanceOf(Dinero);
      expect(resultado.esPositivo()).toBe(true);
    }
  });
});