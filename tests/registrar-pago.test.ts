import { describe, expect, it } from "vitest";
import { Dinero } from "../src/dominio/dinero";
import { RegistrarPago } from "../src/Aplicación/registrar-pago";
import { CreditoRepository } from "../src/Puertos/credito-repository";

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
      buscarPorId: async (creditoId: string) =>
        creditos.get(creditoId),

	listarTodos: async () =>
        Array.from(creditos.values()),

      guardar: async (credito) => {
        creditos.set(credito.creditoId, credito);
      },
    };
  }

  it("registra un pago correctamente", async () => {
    const casoUso = new RegistrarPago(crearRepositorio());

    const respuesta = await casoUso.ejecutar({
      creditoId: "C-001",
      pagoId: "PG-001",
      monto: Dinero.desdeDecimal("100.00"),
      saldos: {
        gastos: Dinero.desdeDecimal("10.00"),
        interesMoratorio: Dinero.desdeDecimal("20.00"),
        interesCorriente: Dinero.desdeDecimal("30.00"),
        capital: Dinero.desdeDecimal("100.00"),
      },
    });

    expect(respuesta.pagoId).toBe("PG-001");

    expect(respuesta.aplicacion.capital.toDecimal()).toBe("40.00");

    expect(respuesta.reproducido).toBe(false);
  });

  it("reproduce la respuesta con el mismo pagoId", async () => {
    const casoUso = new RegistrarPago(crearRepositorio());

    const request = {
      creditoId: "C-001",
      pagoId: "PG-002",
      monto: Dinero.desdeDecimal("100.00"),
      saldos: {
        gastos: Dinero.desdeDecimal("10.00"),
        interesMoratorio: Dinero.desdeDecimal("20.00"),
        interesCorriente: Dinero.desdeDecimal("30.00"),
        capital: Dinero.desdeDecimal("100.00"),
      },
    };

    const primera = await casoUso.ejecutar(request);
    const segunda = await casoUso.ejecutar(request);

    expect(segunda.reproducido).toBe(true);

    expect(segunda.aplicacion.capital.toDecimal()).toBe(
      primera.aplicacion.capital.toDecimal()
    );
  });

  it("cancela un crédito en mora cuando el pago liquida el saldo", async () => {
    const creditos = new Map();

    creditos.set("C-MORA", {
      creditoId: "C-MORA",
      clienteId: "CLI-001",
      saldoCapital: Dinero.desdeDecimal("100.00"),
      estado: "en_mora",
      interesEnSuspenso: Dinero.cero(),
    });

    const repositorio: CreditoRepository = {
      buscarPorId: async (creditoId: string) =>
        creditos.get(creditoId),

	listarTodos: async () =>
        Array.from(creditos.values()),

      guardar: async (credito) => {
        creditos.set(credito.creditoId, credito);
      },
    };

    const casoUso = new RegistrarPago(repositorio);

    await casoUso.ejecutar({
      creditoId: "C-MORA",
      pagoId: "PG-MORA-001",
      monto: Dinero.desdeDecimal("100.00"),
      saldos: {
        gastos: Dinero.cero(),
        interesMoratorio: Dinero.cero(),
        interesCorriente: Dinero.cero(),
        capital: Dinero.desdeDecimal("100.00"),
      },
    });

    const creditoActualizado = await repositorio.buscarPorId("C-MORA");

    expect(creditoActualizado?.estado).toBe("cancelado");

    expect(creditoActualizado?.saldoCapital.toDecimal()).toBe("0.00");
  });

  it("CP-04.2: regulariza y reconoce el interés en suspenso", async () => {
    const creditos = new Map();

    creditos.set("C-SUSPENSO", {
      creditoId: "C-SUSPENSO",
      clienteId: "CLI-001",
      saldoCapital: Dinero.desdeDecimal("725.76"),
      estado: "en_mora",
      fechaDesembolso: "2026-01-01",
      politicaMoraId: "POL-2026-10",
      interesEnSuspenso: Dinero.desdeDecimal("7.26"),
    });

    const repositorio: CreditoRepository = {
      buscarPorId: async (creditoId: string) =>
        creditos.get(creditoId),

	listarTodos: async () =>
        Array.from(creditos.values()),

      guardar: async (credito) => {
        creditos.set(credito.creditoId, credito);
      },
    };

    const casoUso = new RegistrarPago(repositorio);

    const respuesta = await casoUso.ejecutar({
      creditoId: "C-SUSPENSO",
      pagoId: "PG-SUSPENSO-001",
      monto: Dinero.desdeDecimal("100.00"),
      saldos: {
        gastos: Dinero.cero(),
        interesMoratorio: Dinero.cero(),
        interesCorriente: Dinero.cero(),
        capital: Dinero.desdeDecimal("92.74"),
      },
    });

    const creditoActualizado =
      await repositorio.buscarPorId("C-SUSPENSO");

    expect(creditoActualizado?.estado).toBe("vigente");

    expect(respuesta.aplicacion.interesCorriente.toDecimal()).toBe(
      "7.26"
    );

    expect(creditoActualizado?.interesEnSuspenso.toDecimal()).toBe(
      "0.00"
    );
  });

  it("mantiene el crédito en mora cuando el pago parcial no cubre los conceptos vencidos", async () => {
    const creditos = new Map();

    creditos.set("C-MORA-PARCIAL", {
      creditoId: "C-MORA-PARCIAL",
      clienteId: "CLI-001",
      saldoCapital: Dinero.desdeDecimal("500.00"),
      estado: "en_mora",
      fechaDesembolso: "2026-01-01",
      politicaMoraId: "POL-2026-10",
      diasAtraso: 45,
      interesEnSuspenso: Dinero.cero(),
      cargoCobranzaGenerado: true,
    });

    const repositorio: CreditoRepository = {
      buscarPorId: async (creditoId: string) =>
        creditos.get(creditoId),

	listarTodos: async () =>
        Array.from(creditos.values()),

      guardar: async (credito) => {
        creditos.set(credito.creditoId, credito);
      },
    };

    const casoUso = new RegistrarPago(repositorio);

    await casoUso.ejecutar({
      creditoId: "C-MORA-PARCIAL",
      pagoId: "PG-MORA-PARCIAL-001",
      monto: Dinero.desdeDecimal("10.00"),
      saldos: {
        gastos: Dinero.cero(),
        interesMoratorio: Dinero.desdeDecimal("20.00"),
        interesCorriente: Dinero.desdeDecimal("30.00"),
        capital: Dinero.desdeDecimal("500.00"),
      },
    });

    const creditoActualizado =
      await repositorio.buscarPorId("C-MORA-PARCIAL");

    expect(creditoActualizado?.estado).toBe("en_mora");

    expect(creditoActualizado?.saldoCapital.toDecimal()).toBe(
      "500.00"
    );
  });

  it("genera automáticamente el cargo de cobranza Q25 al entrar en Mora 2", async () => {
    const creditos = new Map();

    creditos.set("C-COBRO", {
      creditoId: "C-COBRO",
      clienteId: "CLI-001",
      saldoCapital: Dinero.desdeDecimal("725.76"),
      estado: "en_mora",
      diasAtraso: 31,
      cargoCobranzaGenerado: false,
      interesEnSuspenso: Dinero.cero(),
    });

    const repositorio: CreditoRepository = {
      buscarPorId: async (creditoId: string) =>
        creditos.get(creditoId),

	listarTodos: async () =>
        Array.from(creditos.values()),

      guardar: async (credito) => {
        creditos.set(credito.creditoId, credito);
      },
    };

    const casoUso = new RegistrarPago(repositorio);

    const respuesta = await casoUso.ejecutar({
      creditoId: "C-COBRO",
      pagoId: "PG-COBRO-001",
      monto: Dinero.desdeDecimal("25.00"),
      saldos: {
        gastos: Dinero.cero(),
        interesMoratorio: Dinero.cero(),
        interesCorriente: Dinero.cero(),
        capital: Dinero.cero(),
      },
    });

    expect(respuesta.aplicacion.gastos.toDecimal()).toBe("25.00");

    const creditoActualizado = await repositorio.buscarPorId("C-COBRO");

    expect(creditoActualizado?.cargoCobranzaGenerado).toBe(true);
  });

  it("no vuelve a generar el cargo Q25 si ya fue generado", async () => {
    const creditos = new Map();

    creditos.set("C-COBRO-2", {
      creditoId: "C-COBRO-2",
      clienteId: "CLI-001",
      saldoCapital: Dinero.desdeDecimal("725.76"),
      estado: "en_mora",
      diasAtraso: 45,
      cargoCobranzaGenerado: true,
      interesEnSuspenso: Dinero.cero(),
    });

    const repositorio: CreditoRepository = {
      buscarPorId: async (creditoId: string) =>
        creditos.get(creditoId),

	listarTodos: async () =>
        Array.from(creditos.values()),

      guardar: async (credito) => {
        creditos.set(credito.creditoId, credito);
      },
    };

    const casoUso = new RegistrarPago(repositorio);

    const respuesta = await casoUso.ejecutar({
      creditoId: "C-COBRO-2",
      pagoId: "PG-COBRO-002",
      monto: Dinero.desdeDecimal("25.00"),
      saldos: {
        gastos: Dinero.cero(),
        interesMoratorio: Dinero.cero(),
        interesCorriente: Dinero.cero(),
        capital: Dinero.cero(),
      },
    });

    expect(respuesta.aplicacion.gastos.toDecimal()).toBe("0.00");

    const creditoActualizado =
      await repositorio.buscarPorId("C-COBRO-2");

    expect(creditoActualizado?.cargoCobranzaGenerado).toBe(true);
  });

  it("rechaza un crédito inexistente", async () => {
    const casoUso = new RegistrarPago(crearRepositorio());

    await expect(
      casoUso.ejecutar({
        creditoId: "C-999",
        pagoId: "PG-003",
        monto: Dinero.desdeDecimal("100.00"),
        saldos: {
          gastos: Dinero.cero(),
          interesMoratorio: Dinero.cero(),
          interesCorriente: Dinero.cero(),
          capital: Dinero.desdeDecimal("100.00"),
        },
      })
    ).rejects.toThrow("Crédito no encontrado");
  });
});