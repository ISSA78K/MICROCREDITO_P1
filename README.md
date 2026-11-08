# Sistema de Gestión de Microcrédito - (SGMC)

## Descripción

Proyecto de gestión de microcréditos 

El proyecto implementa la lógica de dominio y casos de uso relacionados con la gestión de créditos, pagos, cartera, mora y generación de cierres, incorporando nuevas funcionalidades de Inteligencia Artificial mediante un asistente IA, RAG (Retrieval-Augmented Generation) y MCP (Model Context Protocol), con el objetivo de complementar las operaciones del sistema.

## Tecnologías

- **TypeScript**
- **Node.js**
- **React 19**, **Vite** y **Tailwind CSS** para la interfaz web.
- **Vitest** para pruebas
- **Zod** para validación de datos.
- **OpenAPI 3.1**
- **Swagger Parser**
- **Decimal.js** representación monetaria en centavos para los cálculos financieros.
- **date-fns**
- **PostgreSQL 16 con pgvector** para persistencia.
- **MCP SDK para TypeScript** para exponer herramientas al asistente.
- **Groq** con el modelo `openai/gpt-oss-120b` para generación de respuestas.
- **Transformers.js** con `Xenova/all-MiniLM-L6-v2` para generar embeddings locales del RAG.
- **Docker Compose** para ejecutar PostgreSQL.

## Requisitos previos

Instalar:

- Node.js 22 LTS (incluye npm).
- Docker Desktop con Docker Compose.
- Una clave API de Groq para utilizar el asistente IA.

## Instalación y configuración

### 1. Clonar el repositorio

```bash
git clone <URL_DEL_REPOSITORIO>
cd MICROCREDITO_P1
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

Copiar el archivo de ejemplo:

**Windows (PowerShell):**
```powershell
Copy-Item .env.example .env
```

**Linux/macOS:**
```bash
cp .env.example .env
```

Configurar el archivo `.env` con los datos de conexión de PostgreSQL:

```env
DB_HOST=localhost
DB_PORT=5433
DB_NAME=microcredito_final
DB_USER=microcredito_app
DB_PASSWORD=MicrocreditoLocal_2026!
GROQ_API_KEY=REEMPLAZAR_CON_TU_CLAVE_GROQ
```

`GROQ_API_KEY` es necesaria para las funciones del asistente de IA. No publicar la clave ni subir el archivo `.env` al repositorio. El archivo `.env.example` debe contener valores de ejemplo, nunca credenciales personales.

> La contraseña mostrada corresponde a la configuración local declarada en `compose.yaml`. Si se modifica en Docker Compose, también debe actualizarse en `.env`.

### 4. Iniciar PostgreSQL

Desde la raíz del proyecto:

```bash
docker compose up -d
```

Verificar que el contenedor esté activo:

```bash
docker compose ps
```

PostgreSQL se expone localmente en el puerto `5433`. La base de datos se llama `microcredito_final`.

### 5. Cargar el esquema y los datos canónicos

Ejecutar el cargador de datos:

```bash
npx tsx src/Adaptadores/postgres/cargar-datos.ts
```

El cargador utiliza por defecto el directorio:

```text
datos-proyecto-final/datos-proyecto-final
```

La ruta puede cambiarse mediante la variable `CV_DATA_DIR`. El proceso verifica la huella SHA-256 de `eventos.jsonl`, lee la bitácora y carga los datos en PostgreSQL. El paquete de datos incluye clientes, créditos, pagos, asesores, políticas y documentos del corpus.

Si se utiliza una ruta personalizada, definirla en `.env`, por ejemplo:

```env
CV_DATA_DIR=./datos-proyecto-final/datos-proyecto-final
```

## Ejecución de la aplicación

La aplicación se ejecuta mediante servicios separados. Mantener las terminales abiertas mientras se utiliza el sistema.

### API backend

En una terminal, desde la raíz:

```bash
npm run api
```

La API se inicia en:

```text
http://localhost:3000
```

Comprobar el estado del servicio desde el navegador:

```text
http://localhost:3000/health
```

### Interfaz web

En otra terminal:

```bash
npm run dev
```

Vite mostrará en la terminal la dirección local de la interfaz, normalmente:

```text
http://localhost:5173
```

Abrir la URL indicada por Vite en el navegador.

## Asistente IA, MCP y RAG

El asistente se encuentra integrado en la API. Utiliza:

- **Groq** y el modelo `openai/gpt-oss-120b` para interpretar consultas y redactar respuestas.
- **MCP** para conectarse con las herramientas de consulta y operación del sistema.
- **RAG** para recuperar información del corpus documental ubicado en `datos-proyecto-final/datos-proyecto-final/corpus`.
- **Transformers.js** con el modelo de embeddings `Xenova/all-MiniLM-L6-v2`.

El RAG fragmenta los documentos Markdown en segmentos de aproximadamente 900 caracteres, con solapamiento de 150 caracteres, genera embeddings y recupera los fragmentos con mayor similitud semántica. La respuesta puede incluir referencias al documento fuente. El contenido documental se trata como información de consulta, no como instrucciones para el asistente.

La primera carga del modelo de embeddings puede tardar porque se descarga y prepara localmente.

## Comandos disponibles

| Comando | Descripción |
|---|---|
| `npm test` | Ejecuta la suite de pruebas con Vitest. |
| `npm run typecheck` | Verifica los tipos TypeScript sin emitir archivos. |
| `npm run generar` | Genera el contrato OpenAPI. |
| `npm run validar` | Valida el contrato OpenAPI generado. |
| `npm run api` | Inicia el servidor API. |
| `npm run dev` | Inicia el servidor de desarrollo de Vite. |
| `npm run build` | Construye la interfaz para producción. |
| `npm run preview` | Sirve localmente la compilación de Vite. |

Para ejecutar pruebas y verificar tipos:

```bash
npm test
npm run typecheck
```

Para generar y validar el contrato:

```bash
npm run generar
npm run validar
```

## Estructura del proyecto

- `src/dominio/` - reglas y lógica del dominio.
- `src/Aplicación/` - casos de uso de la aplicación.
- `src/Puertos/` - interfaces y contratos entre componentes.
- `src/Adaptadores/` - implementaciones de infraestructura.
- `src/Adaptadores/postgres/` - adaptadores para PostgreSQL y carga de datos canónicos.
- `src/Contrato/` - contratos, esquemas y documentos OpenAPI.
- `tests/` - pruebas automatizadas.
- `docs/` - documentación del proyecto.
- `datos-proyecto-final/datos-proyecto-final/` - conjunto de datos canónicos, bitácora de eventos y corpus documental utilizado por el sistema.
- `datos-proyecto-final/datos-proyecto-final/corpus/` - documentos utilizados por el mecanismo RAG para recuperar información relevante.
- `openapi.json` - documentación de la API en formato JSON.
- `openapi.yaml` - documentación de la API en formato YAML.
- `compose.yaml` - configuración de Docker Compose para ejecutar PostgreSQL.
- `.env.example` - archivo de ejemplo para la configuración de variables de entorno.
- `package.json` - configuración del proyecto, dependencias y comandos disponibles.
- `package-lock.json` - registro de las versiones de las dependencias instaladas.
- `tsconfig.json` - configuración del compilador TypeScript.
- `vite.config.ts` - configuración de Vite para la interfaz web.
- `vitest.config.ts` - configuración de Vitest para las pruebas automatizadas.
- `README.md` - documentación principal del proyecto, instalación, configuración y ejecución.

## Casos de uso principales

- Desembolsar un crédito.
- Registrar un pago.
- Consultar la cartera.
- Generar cierre de cartera.

## Estado de las pruebas

El proyecto cuenta actualmente con 117 pruebas aprobadas en 17 archivos.

Resultado de la última ejecución:

- 17 archivos de pruebas aprobados.
- 117 pruebas aprobadas.
- TypeScript sin errores.

## Documentación de API

El Proyecto Final conserva la documentación de la API mediante la especificación OpenAPI 3.1, permitiendo describir y consultar los endpoints disponibles del sistema.

Los documentos generados se encuentran en:

- `openapi.json`
- `openapi.yaml`

La documentación corresponde a la API del Sistema de Gestión de Microcrédito - (SGMC).

## Dependencias

La carpeta `node_modules` es generada mediante `npm install` y no es necesario incluirla en el archivo de entrega, ya que las dependencias pueden instalarse nuevamente utilizando `package.json` y `package-lock.json`.

El proyecto utiliza las siguientes dependencias para implementar sus funcionalidades:

- `express`: creación y gestión del servidor API.
- `pg`: conexión e interacción con PostgreSQL.
- `react` y `react-dom`: desarrollo de la interfaz de usuario.
- `@google/genai`: integración con servicios de Inteligencia Artificial de Google.
- `groq-sdk`: comunicación con los servicios de IA de Groq.
- `openai`: integración con servicios compatibles con la API de OpenAI.
- `@modelcontextprotocol/sdk`: implementación e integración del protocolo MCP.
- `@huggingface/transformers`: ejecución de modelos de procesamiento de información y generación de embeddings utilizados en RAG.
- `csv-parse`: procesamiento y lectura de archivos CSV.
- `dotenv`: gestión de variables de entorno.
- `zod`: validación de datos y definición de esquemas.
- `decimal.js`: manejo de operaciones aritméticas de precisión decimal, especialmente financieras.
- `date-fns`: manipulación y gestión de fechas.
- `@apidevtools/swagger-parser`: análisis y validación de documentos OpenAPI.
- `yaml`: procesamiento de archivos YAML.
- `react-markdown`: representación de contenido Markdown en la interfaz.
- `remark-gfm`: soporte para extensiones de Markdown.
- `remark-math`: soporte para expresiones matemáticas en Markdown.
- `rehype-katex`: representación de expresiones matemáticas.
- `katex`: visualización de fórmulas matemáticas.

### Dependencias de desarrollo

- `typescript`: lenguaje y verificación de tipos del proyecto.
- `tsx`: ejecución de archivos TypeScript.
- `vitest`: ejecución de pruebas automatizadas.
- `@types/node`: definiciones de tipos para Node.js.
- `@types/express`: definiciones de tipos para Express.
- `@types/pg`: definiciones de tipos para PostgreSQL.
- `@types/react`: definiciones de tipos para React.
- `@types/react-dom`: definiciones de tipos para React DOM.
- `@vitejs/plugin-react`: integración de React con Vite.

Las dependencias se encuentran declaradas en los archivos `package.json` y `package-lock.json`, permitiendo instalar y reproducir el entorno de desarrollo del Proyecto Final.

## Uso de herramientas de IA

Durante el desarrollo de este proyecto se utilizaron herramientas de inteligencia artificial como apoyo para:

- Comprender y revisar conceptos de arquitectura de software.
- Apoyar la implementación y revisión del código TypeScript.
- Diseñar y revisar pruebas automatizadas.
- Revisar contratos OpenAPI y esquemas de validación.
- Detectar y corregir errores de tipado y consistencia.
- Apoyar el desarrollo de la funcionalidad de asistencia de IA incorporada al sistema.
- Revisar la integración del asistente de IA con los componentes del proyecto.
- Apoyar la implementación y revisión del mecanismo RAG (Retrieval-Augmented Generation), utilizado para recuperar información relevante y proporcionar contexto a las respuestas del asistente.
- Apoyar la integración y revisión de herramientas mediante MCP (Model Context Protocol), permitiendo al asistente consultar funcionalidades del sistema.
- Diseñar y revisar pruebas relacionadas con el comportamiento del asistente, la recuperación de contexto y la interacción con herramientas MCP.
- Revisar el manejo de respuestas controladas ante situaciones como límites de uso o ausencia de respuestas del proveedor de IA.
- Apoyar la revisión de la consistencia entre las respuestas del asistente y las reglas de negocio del sistema.

La inteligencia artificial se utilizó como herramienta de apoyo durante el desarrollo, sin sustituir la revisión técnica del equipo. Las implementaciones realizadas fueron revisadas y probadas, tomando en cuenta las reglas del dominio, la lógica financiera, los resultados de las pruebas automatizadas y las decisiones de diseño.

## Seguridad

El Sistema de Gestión de Microcrédito (SGMC) considera medidas y recomendaciones de seguridad orientadas a proteger las credenciales de acceso, la información financiera y los datos utilizados por los componentes del sistema.

### Protección de credenciales y variables de entorno

- No compartir ni subir el archivo `.env` al repositorio.
- No publicar claves API, tokens de acceso, contraseñas ni credenciales de conexión.
- Mantener las variables de entorno fuera del código fuente.
- Utilizar credenciales seguras fuera del entorno local de desarrollo.
- Configurar el archivo `.gitignore` para excluir archivos que contengan información sensible.
- Evitar incluir credenciales reales en archivos de documentación, ejemplos de código o capturas de pantalla.
- No utilizar claves API personales o de producción en repositorios públicos.
- Si una clave API se expone accidentalmente, revocarla y generar una nueva.

### Seguridad de la base de datos

- Proteger las credenciales de conexión a PostgreSQL mediante variables de entorno.
- Evitar publicar información de conexión que permita acceder directamente a la base de datos.
- Utilizar usuarios de base de datos con los permisos necesarios para las operaciones del sistema.
- Evitar la modificación manual de los datos canónicos del paquete entregado.
- Proteger la información financiera y personal almacenada en la base de datos.
- Realizar respaldos de la información antes de ejecutar cambios importantes en la base de datos.

### Protección de la información

- No compartir información confidencial de clientes, créditos, pagos o saldos.
- Evitar incluir datos personales o financieros reales en pruebas, ejemplos y documentación.
- Mantener la integridad de los registros de créditos, pagos, cartera, mora y cierres financieros.
- Verificar que las operaciones realizadas por el sistema respeten las reglas del dominio.
- Evitar la modificación directa de los registros financieros fuera de los mecanismos establecidos por la aplicación.

### Seguridad de la API y de la asistencia de IA

- No exponer claves de proveedores de Inteligencia Artificial, como Groq, en el código fuente.
- Gestionar las credenciales del asistente de IA mediante variables de entorno.
- Evitar enviar información confidencial de los clientes a servicios externos de Inteligencia Artificial.
- Validar las entradas recibidas por la API antes de procesarlas.
- Manejar los errores de la API y del asistente de IA de manera controlada, evitando revelar credenciales, rutas internas o información sensible.
- Mantener las herramientas MCP limitadas a las funcionalidades definidas para el sistema.