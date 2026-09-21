# Componentes reemplazables

## Repositorio de créditos

### Abstracción

`CreditoRepository`.

### Implementación actual

`CreditoRepositoryMemoria`.

### Implementaciones posibles

- Repositorio en memoria.
- PostgreSQL.
- Otro sistema de persistencia.

### Beneficio

Los casos de uso dependen de la abstracción `CreditoRepository` y no de
una tecnología específica de persistencia.

Esto permite sustituir el adaptador de almacenamiento sin modificar las
reglas principales del dominio.

---

## Reloj

### Abstracción

`Clock`.

### Implementación

La interfaz `Clock` permite proporcionar una implementación concreta del
reloj al caso de uso.

### Implementaciones posibles

- Reloj real.
- Reloj fijo para pruebas.

### Beneficio

Permite controlar la fecha utilizada por los casos de uso y facilita
pruebas reproducibles sin depender directamente de la fecha u hora del
sistema.

---

## Estrategia de amortización

### Abstracción

`EstrategiaAmortizacion`.

### Implementación actual

`EstrategiaFrancesa`.

### Implementaciones posibles

- Amortización francesa.
- Futuras estrategias de amortización.

### Beneficio

Permite agregar o sustituir métodos de amortización sin modificar la
estructura principal de `PlanAmortizacion`.

---

## Política de mora

### Abstracción

`PoliticaMora`.

### Implementaciones actuales

- `PoliticaPlana`.
- `PoliticaEscalonada`.

### Selección

`SelectorPoliticaMora` selecciona la política correspondiente según la
fecha de desembolso.

### Beneficio

Permite incorporar o sustituir políticas de cálculo de mora sin
modificar la lógica principal de `CalculadoraMora`.

Las políticas pueden coexistir y aplicarse según las reglas de vigencia
definidas por el sistema.

---

## Resumen de reemplazabilidad

| Componente | Abstracción | Implementación actual |
|---|---|---|
| Persistencia | `CreditoRepository` | `CreditoRepositoryMemoria` |
| Reloj | `Clock` | Implementación proporcionada al caso de uso |
| Amortización | `EstrategiaAmortizacion` | `EstrategiaFrancesa` |
| Mora | `PoliticaMora` | `PoliticaPlana` / `PoliticaEscalonada` |

La separación mediante abstracciones permite evolucionar componentes
concretos sin modificar innecesariamente las reglas principales del
dominio.