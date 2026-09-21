# ADR-001 — Arquitectura Hexagonal para separar el dominio de la infraestructura

## Estado

Aceptada

## Fecha

2026-08-29

## Contexto

El Sistema de Gestión de Microcrédito (SGMC) realiza operaciones
financieras que deben ser exactas, reproducibles y auditables, como
cálculo de amortizaciones, intereses moratorios, aplicación de pagos,
cartera en riesgo y generación de cierres.

El sistema también debe continuar evolucionando en proyectos
posteriores. Por esta razón, el núcleo que contiene las reglas del
negocio no debe depender directamente de bases de datos, frameworks,
protocolos HTTP u otras tecnologías de infraestructura.

Se necesita una estructura que permita probar las reglas del negocio
de forma aislada y que permita incorporar o reemplazar adaptadores sin
modificar innecesariamente el dominio.

## Decisión

Se utilizará Arquitectura Hexagonal (Puertos y Adaptadores).

El núcleo de dominio permanecerá independiente de la infraestructura.
Las reglas de negocio se implementarán dentro del dominio y los casos
de uso coordinarán las operaciones mediante interfaces.

Se utilizarán:

- **Puertos primarios:** interfaces mediante las cuales los casos de
  uso pueden ser invocados por adaptadores externos.
- **Puertos secundarios:** interfaces que representan dependencias que
  el núcleo necesita, como persistencia u otros servicios externos.
- **Adaptadores:** implementaciones concretas de los puertos que
  permiten conectar el núcleo con infraestructura o interfaces
  externas.

En consecuencia, las dependencias deben apuntar hacia el núcleo de
dominio y no desde el dominio hacia una tecnología de infraestructura
específica.

Esta decisión permite que el mismo núcleo pueda ser utilizado
posteriormente por una API, una interfaz de usuario u otras
interfaces, sin duplicar las reglas financieras.

## Alternativas consideradas

### 1. Arquitectura en capas tradicional

Se consideró una arquitectura en capas donde presentación, aplicación,
dominio y persistencia se organizan de forma secuencial.

Se descartó porque puede aumentar el acoplamiento entre las reglas de
negocio y los mecanismos concretos de persistencia o infraestructura,
dificultando el reemplazo de adaptadores y las pruebas aisladas del
dominio.

### 2. Acceso directo a infraestructura desde los casos de uso

Se consideró que los casos de uso utilizaran directamente
implementaciones concretas de persistencia o servicios externos.

Se descartó porque haría que la lógica de aplicación dependiera de
detalles tecnológicos concretos y dificultaría sustituir dichas
implementaciones durante la evolución del sistema.

### 3. Arquitectura Hexagonal

Se seleccionó esta alternativa porque permite expresar las
dependencias externas mediante puertos y mantener el núcleo de negocio
independiente de sus adaptadores.

## Consecuencias positivas

- El dominio puede probarse sin depender de infraestructura externa.
- Las reglas financieras quedan concentradas en el núcleo del sistema.
- Se facilita la creación de pruebas unitarias reproducibles.
- Los adaptadores pueden reemplazarse sin modificar las reglas de
  negocio.
- Se facilita incorporar posteriormente API, interfaces de usuario,
  MCP u otros mecanismos de entrada.
- Las dependencias quedan explícitas mediante interfaces.
- La separación permite evolucionar la infraestructura sin trasladar
  esa complejidad al dominio.

## Consecuencias negativas y trade-offs

- Se requiere una mayor cantidad inicial de interfaces y componentes.
- La estructura del proyecto puede resultar más compleja que una
  implementación directa.
- Los desarrolladores deben mantener la regla de dependencias para
  evitar que el dominio vuelva a acoplarse con infraestructura.
- Para operaciones sencillas puede existir código adicional debido a
  los puertos y adaptadores.
- Los cambios arquitectónicos requieren mantener sincronizadas las
  interfaces de los puertos con sus adaptadores.

## Impacto en el proyecto

La decisión se refleja en la separación entre:

- `src/dominio/`: reglas y modelos del negocio.
- `src/Aplicación/`: casos de uso.
- `src/Puertos/`: contratos de entrada y salida.
- `src/adaptadores/`: implementaciones concretas de los puertos.

Por ejemplo, la persistencia de créditos se representa mediante
`CreditoRepository`, mientras que `CreditoRepositoryMemoria` proporciona
una implementación concreta para almacenamiento en memoria.

De esta forma, el caso de uso no necesita conocer los detalles de la
implementación concreta de almacenamiento.

## Atributos de calidad relacionados

- Exactitud funcional.
- Comprobabilidad.
- Mantenibilidad.
- Reemplazabilidad.
- Evolución de la arquitectura.
- Seguridad.