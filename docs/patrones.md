# Patrones de diseño

El proyecto utiliza patrones de diseño de dominio, arquitectónicos y
GoF para mantener bajo acoplamiento, alta cohesión y facilitar la
evolución del sistema.

---

## 1. Objeto de Valor (Value Object) — Dinero

**Categoría:** Patrón de diseño de dominio.

**Implementación:** `src/dominio/dinero.ts`

**Propósito:**

Representar los importes monetarios de forma segura mediante una
abstracción propia del dominio.

**Problema que resuelve:**

Evita depender directamente de `number` para las operaciones monetarias
y permite trabajar internamente con centavos, reduciendo problemas de
precisión de punto flotante.

**Aplicación:**

Las operaciones monetarias se realizan mediante `Dinero`, incluyendo
suma y resta. La representación interna utiliza `bigint` para los
centavos y la moneda soportada por el sistema es GTQ.

---

## 2. Strategy — Amortización

**Categoría:** Patrón GoF.

**Implementación:**

- `src/dominio/plan-amortizacion.ts`
- `EstrategiaAmortizacion`
- `EstrategiaFrancesa`
- `PlanAmortizacion`

**Propósito:**

Encapsular la estrategia utilizada para calcular la cuota de un plan de
amortización.

**Problema que resuelve:**

Permite cambiar o agregar métodos de amortización sin modificar la
estructura principal de `PlanAmortizacion`.

**Aplicación:**

`EstrategiaAmortizacion` define el contrato:

```text
calcularCuota(...)