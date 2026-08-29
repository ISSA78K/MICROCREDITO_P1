import { describe, expect, it } from "vitest";

import { Dinero } from "../src/dominio/dinero";

import {
  RegistrarPago,
} from "../src/Aplicación/registrar-pago";

import {
  CreditoRepository,
} from "../src/Puertos/credito-repository";

describe("RegistrarPago", () => {
  function crearRepositorio(): CreditoRepository {
    const creditos = new Map();

    creditos.set("C-001", {
      creditoId: "C-001",
      clienteId: "CLI-001",
      saldoCapital: Dinero.desdeDecimal("1000.00"),
      estado: "vigente",
    });

    return {
      buscarPorId: (creditoId: string) =>
        creditos.get(creditoId),

      guardar: (credito) => {
        creditos.set(
          credito.creditoId,
          credito
        );
      },
    };
  }

  it("registra un pago correctamente", () => {
    const casoUso =
      new RegistrarPago(
        crearRepositorio()
      );

    const respuesta =
      casoUso.ejecutar({
        creditoId: "C-001",
        pagoId: "PG-001",
        monto:
          Dinero.desdeDecimal("100.00"),
        saldos: {
          gastos:
            Dinero.desdeDecimal("10.00"),
          interesMoratorio:
            Dinero.desdeDecimal("20.00"),
          interesCorriente:
            Dinero.desdeDecimal("30.00"),
          capital:
            Dinero.desdeDecimal("100.00"),
        },
      });

    expect(respuesta.pagoId)
      .toBe("PG-001");

    expect(
      respuesta.aplicacion.capital
        .toDecimal()
    ).toBe("40.00");

    expect(
      respuesta.reproducido
    ).toBe(false);
  });

  it("reproduce la respuesta con el mismo pagoId", () => {
    const casoUso =
      new RegistrarPago(
        crearRepositorio()
      );

    const request = {
      creditoId: "C-001",
      pagoId: "PG-002",
      monto:
        Dinero.desdeDecimal("100.00"),
      saldos: {
        gastos:
          Dinero.desdeDecimal("10.00"),
        interesMoratorio:
          Dinero.desdeDecimal("20.00"),
        interesCorriente:
          Dinero.desdeDecimal("30.00"),
        capital:
          Dinero.desdeDecimal("100.00"),
      },
    };

    const primera =
      casoUso.ejecutar(request);

    const segunda =
      casoUso.ejecutar(request);

    expect(
      segunda.reproducido
    ).toBe(true);

    expect(
      segunda.aplicacion.capital
        .toDecimal()
    ).toBe(
      primera.aplicacion.capital
        .toDecimal()
    );
  });

  it("rechaza un crédito inexistente", () => {
    const casoUso =
      new RegistrarPago(
        crearRepositorio()
      );

    expect(() =>
      casoUso.ejecutar({
        creditoId: "C-999",
        pagoId: "PG-003",
        monto:
          Dinero.desdeDecimal("100.00"),
        saldos: {
          gastos:
            Dinero.cero(),
          interesMoratorio:
            Dinero.cero(),
          interesCorriente:
            Dinero.cero(),
          capital:
            Dinero.desdeDecimal("100.00"),
        },
      })
    ).toThrow("Crédito no encontrado");
  });
});