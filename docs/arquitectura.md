# Decisión de arquitectura

## Arquitectura seleccionada

Arquitectura Hexagonal (Puertos y Adaptadores).

La solución separa las reglas del negocio de la infraestructura
mediante un núcleo de dominio, casos de uso, puertos y adaptadores.

La estructura principal del proyecto es:

```text
src/
├── dominio/
├── Aplicación/
├── Puertos/
├── Adaptadores/
└── Contrato/
```

-dominio/: contiene las reglas y conceptos principales del negocio.
-Aplicación/: contiene los casos de uso que coordinan las operaciones.
-Puertos/: define las interfaces mediante las cuales el núcleo se
comunica con elementos externos.
-Adaptadores/: contiene implementaciones concretas de los puertos.
-Contrato/: contiene los contratos y validaciones de las interfaces
externas mediante OpenAPI y Zod.

## Atributos de calidad priorizados

### 1. Exactitud funcional

Es el atributo principal debido a que el sistema maneja dinero,
intereses, amortizaciones, mora y cartera en riesgo.

La arquitectura separa el núcleo financiero de la infraestructura,
permitiendo que las reglas de negocio se ejecuten sin depender
directamente de una base de datos, red o servidor.

Esto facilita comprobar que los cálculos producen los resultados
esperados mediante pruebas reproducibles.
---


### 2. Comprobabilidad

Las reglas del núcleo de dominio se implementan de forma determinista
y sin dependencias directas de infraestructura.

Las fechas utilizadas por los cálculos se reciben como parámetros y
las dependencias externas, como el reloj y la persistencia, se
abstraen mediante puertos.

Esto permite ejecutar pruebas unitarias rápidas, deterministas y
reproducibles.
---

### 3. Seguridad

La separación entre el núcleo y los adaptadores reduce el acoplamiento
del dominio financiero con elementos externos.

Las entradas externas son validadas mediante contratos definidos con
Zod y OpenAPI.

Los errores utilizan una estructura uniforme y no deben exponer
información sensible.
---

## Justificación

La arquitectura hexagonal permite mantener las reglas financieras
en el núcleo del sistema y conectar posteriormente diferentes
adaptadores.

Los casos de uso de src/Aplicación/ utilizan puertos definidos en
src/Puertos/ y no dependen directamente de una implementación
concreta de infraestructura.

**Por ejemplo:**

RegistrarPago utiliza CreditoRepository.
DesembolsarCredito utiliza CreditoRepository y Clock.
ConsultarCartera utiliza las reglas del dominio mediante Cartera.

La implementación CreditoRepositoryMemoria se encuentra en
src/Adaptadores/memoria/ y puede sustituirse por otra implementación
sin modificar el contrato del puerto.

Los adaptadores primarios pueden incluir una API REST y, en fases
posteriores, el servidor MCP y una interfaz conversacional.

Los adaptadores secundarios pueden proporcionar persistencia y otros
servicios externos sin modificar las reglas principales del dominio.

Por lo tanto, la arquitectura favorece la exactitud funcional,
comprobabilidad y seguridad, además de permitir la evolución del
sistema en los siguientes proyectos.

## Escenarios de calidad
### Exactitud funcional

**Escenario:** Registrar un pago.

**Estímulo:** Un cliente realiza un pago de Q1,000.00.

**Respuesta esperada:** El sistema aplica el pago exactamente
en el orden de prelación y devuelve un desglose reproducible.

**Medida:** La suma de las aplicaciones debe ser igual al monto
recibido, considerando cualquier excedente generado.

### Comprobabilidad

**Escenario:** Ejecutar dos veces un cálculo financiero con los
mismos datos de entrada.

**Estímulo:** Se proporciona el mismo crédito, fecha de corte,
tasa y plan.

**Respuesta esperada:** Ambas ejecuciones producen exactamente
el mismo resultado.

**Medida:** Los resultados deben ser iguales.

### Seguridad

**Escenario:** Entrada inválida en la API.

**Estímulo:** Un consumidor envía datos que no cumplen el contrato.

**Respuesta esperada:** El sistema rechaza la entrada y devuelve
un error uniforme sin exponer información sensible.

**Medida:** La respuesta utiliza Problem Details y no contiene
datos sensibles.