# Decisiones de diseño de componentes

## 1. Separación del dominio

El núcleo de dominio no dependerá de infraestructura.

Las reglas financieras estarán concentradas en componentes
del dominio y serán independientes de base de datos, servidor
HTTP o interfaz gráfica.

Esto permite ejecutar las reglas mediante pruebas unitarias.

## 2. Objeto de Valor Dinero

Todo importe monetario utilizará el objeto de valor Dinero.

Dinero encapsula el valor y la moneda y evita que diferentes
partes del sistema manejen importes monetarios de manera
inconsistente.

## 3. Plan de amortización

La generación del plan de amortización estará encapsulada
en PlanAmortizacion.

El diseño permitirá aplicar diferentes estrategias de cálculo
sin modificar el resto del dominio.

## 4. Calculadora de mora

CalculadoraMora será responsable del cálculo de los días de
atraso, interés moratorio y clasificación del tramo de mora.

La fecha de corte será recibida como parámetro para garantizar
la reproducibilidad de las pruebas.

## 5. Prelación de pagos

PrelacionPago será responsable de aplicar el pago siguiendo
el orden establecido por el negocio.

El orden será:

1. Gastos y comisiones.
2. Interés moratorio.
3. Interés corriente.
4. Capital.

Cada concepto consume el monto correspondiente y el remanente
continúa hacia el siguiente concepto.

## 6. Estado del crédito

El ciclo de vida del crédito será modelado mediante estados.

Las transiciones inválidas deberán ser rechazadas por diseño.

Esto permite proteger las reglas del ciclo de vida y evitar
operaciones que no corresponden al estado actual del crédito.

## 7. Cartera en riesgo

Cartera será responsable de calcular los indicadores de cartera
en riesgo.

La clasificación se realizará utilizando los datos del crédito
y su situación de atraso.

## 8. Repositorio

La persistencia se representará mediante un puerto o interfaz.

El dominio no dependerá directamente de una tecnología de base
de datos.

Durante las pruebas podrá utilizarse una implementación en memoria.

## 9. Principios SOLID

### Single Responsibility Principle

Cada componente tendrá una responsabilidad principal.

### Open/Closed Principle

Las estrategias de cálculo podrán extenderse sin modificar
el núcleo existente.

### Dependency Inversion Principle

El dominio dependerá de abstracciones y no de implementaciones
de infraestructura.

## 10. GRASP

### Experto en información

La responsabilidad se asignará al componente que posee la
información necesaria para realizar una operación.

### Alta cohesión

Cada componente tendrá responsabilidades relacionadas.

### Bajo acoplamiento

Los componentes evitarán dependencias innecesarias entre sí.

### Polimorfismo

Las políticas que puedan variar se representarán mediante
abstracciones y estrategias.

## 11. Comprobabilidad

Las funciones del núcleo serán puras siempre que sea posible.

Las fechas necesarias para los cálculos se recibirán como
parámetros.

No se utilizará directamente la fecha del sistema dentro
de las reglas financieras.

## 12. Evolución

La arquitectura permitirá agregar nuevos adaptadores sin
modificar las reglas principales del dominio.

Esto permitirá incorporar posteriormente API REST, servidor
MCP y otras interfaces.