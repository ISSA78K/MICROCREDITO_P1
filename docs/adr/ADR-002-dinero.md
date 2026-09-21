# ADR-002 — Representación monetaria mediante el objeto de valor Dinero

## Estado

Aceptada

## Fecha

2026-08-29

## Contexto

El Sistema de Gestión de Microcrédito realiza operaciones financieras
que requieren exactitud en importes monetarios, incluyendo
amortizaciones, intereses, pagos, saldos de capital, mora y cartera.

El uso directo de `Number` de JavaScript para representar importes
monetarios puede producir problemas de precisión debido a la
representación binaria de los números de punto flotante.

Además, el sistema debe evitar operaciones accidentales entre
monedas diferentes y debe mantener una representación consistente de
los importes entre el dominio y las interfaces externas.

Por estas razones se necesita una representación monetaria explícita
que encapsule las operaciones permitidas y mantenga las reglas de
moneda dentro del dominio.

## Decisión

Los importes monetarios se representarán mediante el objeto de valor
`Dinero`.

`Dinero` será responsable de:

- Representar el importe monetario.
- Mantener la moneda asociada.
- Realizar operaciones de suma y resta.
- Validar que las operaciones no mezclen monedas diferentes.
- Convertir importes desde una representación decimal.
- Convertir importes nuevamente a una representación decimal con dos
  decimales.

La moneda soportada por el proyecto es `GTQ`.

Internamente, el importe se representa mediante `bigint` en centavos,
evitando utilizar `Number` de punto flotante para almacenar dinero.

Por ejemplo:

- `Q10.00` se representa internamente como `1000` centavos.
- `Q725.76` se representa internamente como `72576` centavos.

La representación decimal externa utilizará exactamente dos
decimales, por ejemplo `725.76`.

No se utilizará `Number` de punto flotante como representación interna
de importes monetarios.

## Alternativas consideradas

### 1. Utilizar `Number` directamente

Se consideró utilizar el tipo `Number` de JavaScript para almacenar y
operar los importes monetarios.

Se descartó porque `Number` utiliza representación de punto flotante
y puede producir diferencias de precisión en determinadas operaciones
aritméticas.

### 2. Representar el dinero como cadenas

Se consideró almacenar los importes directamente como cadenas, por
ejemplo `"725.76"`.

Se descartó porque las cadenas no proporcionan por sí mismas
operaciones aritméticas seguras y obligarían a realizar conversiones
repetitivas fuera de una abstracción común.

### 3. Utilizar una librería decimal como representación del objeto de valor

Se consideró utilizar directamente una biblioteca de precisión decimal
para representar todos los importes monetarios.

Se descartó como representación principal del dominio porque el
proyecto necesita una abstracción propia que represente además la
moneda y las operaciones monetarias permitidas.

Las operaciones que requieren precisión decimal pueden utilizar
`decimal.js` internamente cuando corresponde, mientras que el objeto
`Dinero` mantiene la representación monetaria del dominio en centavos.

### 4. Utilizar `bigint` en centavos mediante `Dinero`

Se seleccionó esta alternativa porque permite representar cantidades
monetarias como unidades enteras mínimas y evita los problemas de
precisión asociados con el punto flotante.

Además, encapsular esta representación dentro de `Dinero` evita que el
resto del dominio tenga que conocer cómo se almacenan internamente los
importes.

## Consecuencias positivas

- Evita utilizar números de punto flotante para almacenar dinero.
- Mantiene una representación exacta en centavos.
- Permite realizar operaciones monetarias explícitas mediante
  `sumar` y `restar`.
- Impide operar directamente con monedas diferentes.
- Centraliza la representación monetaria en un único objeto de valor.
- Facilita la creación de pruebas sobre invariantes monetarias.
- Mantiene una representación decimal consistente para las entradas y
  salidas.
- Permite que las reglas de negocio trabajen con importes sin depender
  de su formato externo.

## Consecuencias negativas y trade-offs

- Requiere utilizar el objeto `Dinero` en lugar de números simples.
- Las operaciones aritméticas monetarias deben realizarse mediante los
  métodos definidos por `Dinero`.
- Los desarrolladores deben convertir explícitamente los valores
  externos a `Dinero`.
- El uso de `bigint` requiere cuidado al interactuar con APIs o
  librerías que esperan valores `number`.
- Existe código adicional frente a utilizar directamente un tipo
  numérico.

## Impacto en el proyecto

La decisión se implementa mediante:

- `src/dominio/dinero.ts`: objeto de valor `Dinero`.
- `Dinero.desdeDecimal(...)`: creación de importes desde cadenas con
  dos decimales.
- `Dinero.sumar(...)`: suma monetaria.
- `Dinero.restar(...)`: resta monetaria.
- `Dinero.toDecimal()`: representación decimal externa.
- `centavos: bigint`: representación interna exacta.
- `Moneda = "GTQ"`: moneda soportada por el sistema.

Los demás componentes del dominio utilizan `Dinero` para importes
monetarios, en lugar de representar esos valores directamente como
`number`.

## Invariantes

La implementación debe mantener las siguientes invariantes:

1. Un importe monetario siempre pertenece a la moneda `GTQ`.
2. No se pueden sumar o restar importes de monedas diferentes.
3. La representación decimal externa utiliza exactamente dos
   decimales.
4. La representación interna utiliza unidades enteras de centavos.
5. Las operaciones monetarias conservan la exactitud del importe.
6. El saldo de una operación financiera no debe depender de
   aproximaciones binarias de punto flotante.

## Atributos de calidad relacionados

- Exactitud funcional.
- Comprobabilidad.
- Mantenibilidad.
- Consistencia.
- Reemplazabilidad de la representación interna.