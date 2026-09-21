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
      interesEnSuspenso: Dinero.cero(),
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

    it("cancela un crédito en mora cuando el pago liquida el saldo", () => {
    const creditos = new Map();

    creditos.set("C-MORA", {
      creditoId: "C-MORA",
      clienteId: "CLI-001",
      saldoCapital: Dinero.desdeDecimal("100.00"),
      estado: "en_mora",
      interesEnSuspenso: Dinero.cero(),
    });

    const repositorio: CreditoRepository = {
      buscarPorId: (creditoId: string) =>
        creditos.get(creditoId),

      guardar: (credito) => {
        creditos.set(
          credito.creditoId,
          credito
        );
      },
    };

    const casoUso =
      new RegistrarPago(repositorio);

    casoUso.ejecutar({
      creditoId: "C-MORA",
      pagoId: "PG-MORA-001",
      monto:
        Dinero.desdeDecimal("100.00"),
      saldos: {
        gastos: Dinero.cero(),
        interesMoratorio: Dinero.cero(),
        interesCorriente: Dinero.cero(),
        capital:
          Dinero.desdeDecimal("100.00"),
      },
    });

    const creditoActualizado =
      repositorio.buscarPorId("C-MORA");

    expect(creditoActualizado?.estado)
      .toBe("cancelado");

    expect(
      creditoActualizado?.saldoCapital.toDecimal()
    ).toBe("0.00");
  });

    it("CP-04.2: regulariza y reconoce el interés en suspenso", () => {
  const creditos = new Map();

  creditos.set("C-SUSPENSO", {
    creditoId: "C-SUSPENSO",
    clienteId: "CLI-001",
    saldoCapital:
      Dinero.desdeDecimal("725.76"),
    estado: "en_mora",
    fechaDesembolso: "2026-01-01",
    politicaMoraId: "POL-2026-10",
    interesEnSuspenso:
      Dinero.desdeDecimal("7.26"),
  });

  const repositorio: CreditoRepository = {
    buscarPorId: (creditoId: string) =>
      creditos.get(creditoId),

    guardar: (credito) => {
      creditos.set(
        credito.creditoId,
        credito
      );
    },
  };

  const casoUso =
    new RegistrarPago(repositorio);

  const respuesta =
    casoUso.ejecutar({
      creditoId: "C-SUSPENSO",
      pagoId: "PG-SUSPENSO-001",
      monto:
        Dinero.desdeDecimal("100.00"),
      saldos: {
        gastos: Dinero.cero(),
        interesMoratorio: Dinero.cero(),
        interesCorriente:
          Dinero.cero(),
        capital:
          Dinero.desdeDecimal("92.74"),
      },
    });

  const creditoActualizado =
    repositorio.buscarPorId(
      "C-SUSPENSO"
    );

  expect(creditoActualizado?.estado)
    .toBe("vigente");

  expect(
    respuesta.aplicacion.interesCorriente
      .toDecimal()
  ).toBe("7.26");

  expect(
    creditoActualizado?.interesEnSuspenso
      .toDecimal()
  ).toBe("0.00");
});

it("genera automáticamente el cargo de cobranza Q25 al entrar en Mora 2", () => {
  const creditos = new Map();

  creditos.set("C-COBRO", {
    creditoId: "C-COBRO",
    clienteId: "CLI-001",
    saldoCapital:
      Dinero.desdeDecimal("725.76"),
    estado: "en_mora",
    diasAtraso: 31,
    cargoCobranzaGenerado: false,
    interesEnSuspenso: Dinero.cero(),
  });

  const repositorio: CreditoRepository = {
    buscarPorId: (creditoId: string) =>
      creditos.get(creditoId),

    guardar: (credito) => {
      creditos.set(
        credito.creditoId,
        credito
      );
    },
  };

  const casoUso =
    new RegistrarPago(repositorio);

  const respuesta =
    casoUso.ejecutar({
      creditoId: "C-COBRO",
      pagoId: "PG-COBRO-001",
      monto:
        Dinero.desdeDecimal("25.00"),
      saldos: {
        gastos: Dinero.cero(),
        interesMoratorio: Dinero.cero(),
        interesCorriente: Dinero.cero(),
        capital: Dinero.cero(),
      },
    });

  expect(
    respuesta.aplicacion.gastos.toDecimal()
  ).toBe("25.00");

  const creditoActualizado =
    repositorio.buscarPorId("C-COBRO");

  expect(
    creditoActualizado?.cargoCobranzaGenerado
  ).toBe(true);
});

it("no vuelve a generar el cargo Q25 si ya fue generado", () => {
  const creditos = new Map();

  creditos.set("C-COBRO-2", {
    creditoId: "C-COBRO-2",
    clienteId: "CLI-001",
    saldoCapital:
      Dinero.desdeDecimal("725.76"),
    estado: "en_mora",
    diasAtraso: 45,
    cargoCobranzaGenerado: true,
    interesEnSuspenso: Dinero.cero(),
  });

  const repositorio: CreditoRepository = {
    buscarPorId: (creditoId: string) =>
      creditos.get(creditoId),

    guardar: (credito) => {
      creditos.set(
        credito.creditoId,
        credito
      );
    },
  };

  const casoUso =
    new RegistrarPago(repositorio);

  const respuesta =
    casoUso.ejecutar({
      creditoId: "C-COBRO-2",
      pagoId: "PG-COBRO-002",
      monto:
        Dinero.desdeDecimal("25.00"),
      saldos: {
        gastos: Dinero.cero(),
        interesMoratorio: Dinero.cero(),
        interesCorriente: Dinero.cero(),
        capital: Dinero.cero(),
      },
    });

  expect(
    respuesta.aplicacion.gastos.toDecimal()
  ).toBe("0.00");

  const creditoActualizado =
    repositorio.buscarPorId("C-COBRO-2");

  expect(
    creditoActualizado?.cargoCobranzaGenerado
  ).toBe(true);
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