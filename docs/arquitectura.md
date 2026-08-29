# Decisión de arquitectura

## Arquitectura seleccionada

Arquitectura Hexagonal (Puertos y Adaptadores).

## Atributos de calidad priorizados

### 1. Exactitud funcional

Es el atributo principal debido a que el sistema maneja dinero,
intereses, amortizaciones, mora y cartera en riesgo.

La arquitectura separa el núcleo financiero de la infraestructura,
permitiendo que las reglas de negocio se ejecuten sin depender de
base de datos, red o servidor.

Esto facilita comprobar que los cálculos producen los resultados
esperados.

### 2. Comprobabilidad

El núcleo de dominio se implementará como funciones puras y sin
dependencias de infraestructura.

Esto permite ejecutar pruebas unitarias de manera rápida,
determinista y reproducible.

Las fechas utilizadas por los cálculos se recibirán como parámetros
y no se dependerá directamente de la fecha del sistema.

### 3. Seguridad

La separación entre el núcleo y los adaptadores reduce la superficie
del dominio financiero.

Las entradas externas serán validadas mediante contratos definidos
con Zod y OpenAPI.

Los errores utilizarán una estructura uniforme y no deberán exponer
información sensible.

## Justificación

La arquitectura hexagonal permite mantener las reglas financieras
en el núcleo del sistema y conectar posteriormente diferentes
adaptadores.

Los adaptadores primarios pueden incluir la API REST y, en fases
posteriores, el servidor MCP y la interfaz conversacional.

Los adaptadores secundarios pueden proporcionar persistencia y
servicios externos sin modificar las reglas del dominio.

Por lo tanto, la arquitectura favorece la exactitud funcional,
comprobabilidad y seguridad, además de permitir la evolución del
sistema en los siguientes proyectos.

# Escenarios de calidad

## Exactitud funcional

**Escenario:** Registrar un pago.

**Estímulo:** Un cliente realiza un pago de Q1,000.00.

**Respuesta esperada:** El sistema aplica el pago exactamente
en el orden de prelación y devuelve un desglose reproducible.

**Medida:** La suma de las aplicaciones debe ser igual al monto
recibido más cualquier excedente permitido.

---

## Comprobabilidad

**Escenario:** Ejecutar dos veces el cálculo financiero con los
mismos datos de entrada.

**Estímulo:** Se proporciona el mismo crédito, fecha de corte,
tasa y plan.

**Respuesta esperada:** Ambas ejecuciones producen exactamente
el mismo resultado.

**Medida:** Los resultados deben ser iguales.

---

## Seguridad

**Escenario:** Entrada inválida en la API.

**Estímulo:** Un consumidor envía datos que no cumplen el contrato.

**Respuesta esperada:** El sistema rechaza la entrada y devuelve
un error uniforme sin exponer información sensible.

**Medida:** La respuesta utiliza Problem Details y no contiene
datos sensibles.