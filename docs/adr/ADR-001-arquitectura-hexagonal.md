# ADR-001 — Arquitectura Hexagonal

## Estado

Aceptada

## Contexto

El Sistema de Gestión de Microcrédito maneja cálculos financieros
que deben ser exactos, reproducibles y auditables.

Además, el sistema continuará evolucionando en proyectos posteriores
con nuevos adaptadores.

## Decisión

Se utilizará Arquitectura Hexagonal (Puertos y Adaptadores).

El núcleo de dominio permanecerá independiente de infraestructura.

Los casos de uso estarán expuestos mediante puertos primarios.

La persistencia y servicios externos serán conectados mediante
puertos secundarios.

## Consecuencias positivas

- Mayor comprobabilidad.
- Núcleo independiente de infraestructura.
- Facilita pruebas unitarias.
- Permite cambiar adaptadores.
- Facilita incorporar posteriormente API, MCP y otras interfaces.

## Consecuencias negativas

- Mayor cantidad inicial de interfaces y componentes.
- Requiere disciplina para mantener las dependencias correctamente.

## Atributos de calidad relacionados

- Exactitud funcional.
- Comprobabilidad.
- Seguridad.