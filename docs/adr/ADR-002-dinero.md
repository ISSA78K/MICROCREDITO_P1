# ADR-002 — Representación del dinero

## Estado

Aceptada

## Contexto

El sistema realiza cálculos monetarios y financieros.
El uso de números de punto flotante puede introducir errores
de precisión.

## Decisión

Los importes monetarios se representarán mediante el objeto
de valor Dinero.

La representación externa utilizará una cadena decimal con
dos decimales y código de moneda.

Los cálculos internos utilizarán una representación decimal
precisa o unidades enteras mínimas.

No se utilizará Number de punto flotante para representar
importes monetarios.

## Consecuencias positivas

- Evita errores de precisión.
- Mantiene exactitud financiera.
- Impide mezclar monedas.
- Facilita las pruebas de invariantes.

## Consecuencias negativas

- Requiere una implementación específica del objeto Dinero.
- Los cálculos necesitan operaciones monetarias explícitas.

## Atributos de calidad relacionados

- Exactitud funcional.
- Comprobabilidad.