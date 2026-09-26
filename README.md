# Sistema de Gestión de Microcrédito - Crédito Vecino

## Descripción

Proyecto de gestión de microcréditos desarrollado en TypeScript.

El proyecto implementa la lógica de dominio y casos de uso relacionados con la gestión de créditos, pagos, cartera, mora y generación de cierres.

## Tecnologías

- TypeScript
- Node.js
- Vitest
- Zod
- OpenAPI 3.1
- Swagger Parser
- Decimal.js
- date-fns

## Estructura del proyecto

- `src/dominio/` - reglas y lógica del dominio.
- `src/Aplicación/` - casos de uso de la aplicación.
- `src/Puertos/` - interfaces y contratos entre componentes.
- `src/Adaptadores/` - implementaciones de infraestructura.
- `src/Contrato/` - contratos, esquemas y documentos OpenAPI.
- `tests/` - pruebas automatizadas.
- `docs/` - documentación del proyecto.

## Casos de uso principales

- Desembolsar un crédito.
- Registrar un pago.
- Consultar la cartera.
- Generar cierre de cartera.

## Comandos

Instalar dependencias:

`npm install`

Ejecutar las pruebas:

`npm test`

Verificar tipos de TypeScript:

`npm run typecheck`

Generar los documentos OpenAPI:

`npm run generar`

Validar el documento OpenAPI:

`npm run validar`

## Estado de las pruebas

El proyecto cuenta actualmente con 60 pruebas automatizadas.

Resultado de la última ejecución:

- 11 archivos de pruebas aprobados.
- 60 pruebas aprobadas.
- TypeScript sin errores.

## Documentación de API

Los documentos generados se encuentran en:

- `openapi.json`
- `openapi.yaml`

## Dependencias

La carpeta `node_modules` es generada mediante `npm install` y no es necesario incluirla en el archivo de entrega, ya que las dependencias pueden instalarse nuevamente utilizando `package.json` y `package-lock.json`.

## Uso de herramientas de IA

Durante el desarrollo de este proyecto se utilizaron herramientas de inteligencia artificial como apoyo para:

- Comprender y revisar conceptos de arquitectura de software.
- Apoyar la implementación y revisión del código TypeScript.
- Diseñar y revisar pruebas automatizadas.
- Revisar contratos OpenAPI y esquemas de validación.
- Detectar y corregir errores de tipado y consistencia.

La herramienta de IA se utilizó como apoyo durante el desarrollo. El equipo revisó, probó y comprendió las implementaciones realizadas, incluyendo las reglas del dominio, las pruebas y las decisiones de diseño.

## Link de prototipo en Moqups
https://docs.google.com/document/d/10qhsl_RQ54gfzhbDkF4QWpQZSZ4N3DJrCSsolkIYlbw/edit?tab=t.0
