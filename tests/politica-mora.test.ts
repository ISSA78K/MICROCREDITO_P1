
import { describe, expect, it } from "vitest";

import { Dinero } from "../src/dominio/dinero";
import { PoliticaPlana } from "../src/dominio/politica-mora/politica-plana";
import { PoliticaEscalonada } from "../src/dominio/politica-mora/politica-escalonada";
import { PoliticaRetroactiva } from "../src/dominio/politica-mora/politica-retroactiva";
import { SelectorPoliticaMora } from "../src/dominio/politica-mora/selector-politica-mora";

const capital = Dinero.desdeDecimal("725.76");

describe("Políticas de mora", () => {
  describe("PoliticaPlana", () => {
    it("calcula 15 días al 24% anual", () => {
      const politica = new PoliticaPlana();

      const resultado = politica.calcularInteres(
        capital,
        15
      );

      expect(resultado.toDecimal()).toBe("7.26");
    });
  });

  describe("PoliticaEscalonada", () => {
    it("M-1: calcula 15 días", () => {
      const politica = new PoliticaEscalonada();

      const resultado = politica.calcularInteres(
        capital,
        15
      );

      expect(resultado.toDecimal()).toBe("5.44");
    });

    it("M-2: calcula 45 días", () => {
      const politica = new PoliticaEscalonada();

      const resultado = politica.calcularInteres(
        capital,
        45
      );

      expect(resultado.toDecimal()).toBe("18.14");
    });

    it("M-3: calcula 100 días", () => {
      const politica = new PoliticaEscalonada();

      const resultado = politica.calcularInteres(
        capital,
        100
      );

      expect(resultado.toDecimal()).toBe("50.80");
    });

    it("M-4: calcula 120 días", () => {
      const politica = new PoliticaEscalonada();

      const resultado = politica.calcularInteres(
        capital,
        120
      );

      expect(resultado.toDecimal()).toBe("65.32");
    });

    it("no calcula mora después de 120 días", () => {
      const politica = new PoliticaEscalonada();

      const resultado = politica.calcularInteres(
        capital,
        121
      );

      expect(resultado.toDecimal()).toBe("0.00");
    });

    it("verifica el último día del primer tramo: 30 días", () => {
      const politica = new PoliticaEscalonada();

      const resultado = politica.calcularInteres(
        capital,
        30
      );

      expect(resultado.toDecimal()).toBe("10.89");
    });

    it("verifica el inicio del segundo tramo: 31 días", () => {
      const politica = new PoliticaEscalonada();

      const resultado = politica.calcularInteres(
        capital,
        31
      );

      expect(resultado.toDecimal()).toBe("11.37");
    });

    it("verifica el último día del segundo tramo: 60 días", () => {
      const politica = new PoliticaEscalonada();

      const resultado = politica.calcularInteres(
        capital,
        60
      );

      expect(resultado.toDecimal()).toBe("25.40");
    });

    it("verifica el inicio del tercer tramo: 61 días", () => {
      const politica = new PoliticaEscalonada();

      const resultado = politica.calcularInteres(
        capital,
        61
      );

      expect(resultado.toDecimal()).toBe("26.01");
    });

    it("verifica el interés acumulado al día 90", () => {
      const politica = new PoliticaEscalonada();

      const resultado = politica.calcularInteres(
        capital,
        90
      );

      expect(resultado.toDecimal()).toBe("43.55");
    });

    it("verifica el interés acumulado al día 91", () => {
      const politica = new PoliticaEscalonada();

      const resultado = politica.calcularInteres(
        capital,
        91
      );

      expect(resultado.toDecimal()).toBe("44.27");
    });

    it("invariante: el interés moratorio es monótono con los días de atraso", () => {
      const politica = new PoliticaEscalonada();

      const mora15 =
        politica.calcularInteres(capital, 15);

      const mora45 =
        politica.calcularInteres(capital, 45);

      const mora100 =
        politica.calcularInteres(capital, 100);

      const mora120 =
        politica.calcularInteres(capital, 120);

      expect(
        mora45.centavos
      ).toBeGreaterThanOrEqual(
        mora15.centavos
      );

      expect(
        mora100.centavos
      ).toBeGreaterThanOrEqual(
        mora45.centavos
      );

      expect(
        mora120.centavos
      ).toBeGreaterThanOrEqual(
        mora100.centavos
      );
    });

    it("invariante: el interés moratorio no supera el capital en mora", () => {
      const politica = new PoliticaEscalonada();

      const resultado =
        politica.calcularInteres(
          capital,
          120
        );

      expect(
        resultado.centavos
      ).toBeLessThanOrEqual(
        capital.centavos
      );
    });

    it("invariante: la política escalonada no supera la retroactiva", () => {
      const escalonada =
        new PoliticaEscalonada();

      const retroactiva =
        new PoliticaRetroactiva();

      for (const dias of [15, 45, 100, 120]) {
        const resultadoEscalonada =
          escalonada.calcularInteres(
            capital,
            dias
          );

        const resultadoRetroactiva =
          retroactiva.calcularInteres(
            capital,
            dias
          );

        expect(
          resultadoEscalonada.centavos
        ).toBeLessThanOrEqual(
          resultadoRetroactiva.centavos
        );
      }
    });
  });

  describe("SelectorPoliticaMora", () => {
    it("selecciona la política plana para créditos anteriores al 01/10/2026", () => {
      const selector = new SelectorPoliticaMora();

      const politica =
        selector.seleccionar("2026-09-30");

      expect(politica.id).toBe("POL-2024-01");
    });

    it("selecciona la política escalonada desde el 01/10/2026", () => {
      const selector = new SelectorPoliticaMora();

      const politica =
        selector.seleccionar("2026-10-01");

      expect(politica.id).toBe("POL-2026-10");
    });

    it("mantiene ambas políticas disponibles para coexistencia", () => {
      const selector = new SelectorPoliticaMora();

      const politicaAnterior =
        selector.seleccionar("2026-09-30");

      const politicaNueva =
        selector.seleccionar("2026-10-01");

      expect(politicaAnterior.id).toBe(
        "POL-2024-01"
      );

      expect(politicaNueva.id).toBe(
        "POL-2026-10"
      );
    });

    it("CP-03: calcula 45 días con la política correspondiente", () => {
      const selector = new SelectorPoliticaMora();

      const politicaAnterior =
        selector.seleccionar("2026-09-30");

      const politicaNueva =
        selector.seleccionar("2026-10-01");

      const moraAnterior =
        politicaAnterior.calcularInteres(
          capital,
          45
        );

      const moraNueva =
        politicaNueva.calcularInteres(
          capital,
          45
        );

      expect(moraAnterior.toDecimal()).toBe("21.77");
      expect(moraNueva.toDecimal()).toBe("18.14");
    });
  });
});