
# Decisiones de diseño de componentes

## 1. Separación del dominio

El núcleo de dominio es independiente de la infraestructura.

Las reglas financieras se concentran en los componentes del dominio y no
dependen de base de datos, servidor HTTP ni interfaz gráfica.

Esto permite ejecutar las reglas mediante pruebas unitarias
deterministas.

## 2. Objeto de Valor Dinero

Todo importe monetario utiliza el objeto de valor `Dinero`.

`Dinero` encapsula el valor monetario y las operaciones financieras,
evitando el uso directo de números de punto flotante para representar
importes.

## 3. Plan de amortización

La generación del plan de amortización está encapsulada en
`PlanAmortizacion`.

El cálculo de la cuota se delega a `EstrategiaAmortizacion`, cuya
implementación actual es `EstrategiaFrancesa`.

Este diseño permite incorporar nuevas estrategias sin modificar el resto
del dominio.

## 4. Calculadora de mora

`CalculadoraMora` es responsable de calcular:

- Días de atraso.
- Interés moratorio.
- Tramo de mora.
- Interés en suspenso.

La fecha de corte se recibe como parámetro para garantizar resultados
reproducibles.

## 5. Prelación de pagos

`PrelacionPago` aplica el pago siguiendo el orden definido por el negocio:

1. Gastos y comisiones.
2. Interés moratorio.
3. Interés corriente.
4. Capital.

Cada concepto consume únicamente el saldo pendiente correspondiente y el
remanente continúa hacia el siguiente concepto.

## 6. Estado del crédito

El ciclo de vida del crédito se modela mediante estados del dominio.

Las transiciones válidas incluyen operaciones como:

- Desembolsar.
- Regularizar.
- Reestructurar.
- Declarar incobrable.
- Cancelar.

Las transiciones inválidas son rechazadas por diseño.

## 7. Cartera en riesgo

`Cartera` calcula los indicadores financieros de cartera, incluyendo:

- Cartera activa.
- Saldo en riesgo.
- Porcentaje de cartera en riesgo.
- Clasificación por tramo.
- Saldo declarado incobrable.

La clasificación considera los días de atraso y los créditos
reestructurados.

## 8. Repositorio

La persistencia se representa mediante la abstracción
`CreditoRepository`.

Los casos de uso dependen únicamente del puerto y la implementación
actual corresponde a `CreditoRepositoryMemoria`.

Este diseño permite sustituir posteriormente el mecanismo de persistencia
sin modificar el dominio.

## 9. Principios SOLID

### Single Responsibility Principle

Cada componente posee una única responsabilidad principal.

### Open/Closed Principle

Las estrategias de amortización y las políticas de mora pueden extenderse
sin modificar el núcleo existente.

### Dependency Inversion Principle

Los casos de uso dependen de abstracciones (`CreditoRepository`, `Clock`)
y no de implementaciones concretas.

## 10. Principios GRASP

### Experto en información

Cada responsabilidad se asigna al componente que posee la información
necesaria para ejecutarla.

### Alta cohesión

Las responsabilidades relacionadas permanecen agrupadas dentro del mismo
componente del dominio.

### Bajo acoplamiento

Los componentes se comunican mediante puertos e interfaces, reduciendo
dependencias innecesarias.

### Polimorfismo

Las variaciones de comportamiento se implementan mediante estrategias y
abstracciones (`EstrategiaAmortizacion` y `PoliticaMora`).

## 11. Comprobabilidad

Las reglas financieras producen resultados deterministas para las mismas
entradas.

Las fechas necesarias para los cálculos se reciben como parámetros o se
abstraen mediante el puerto `Clock`.

Esto permite ejecutar pruebas reproducibles sin depender del reloj del
sistema.

## 12. Evolución

La arquitectura permite incorporar nuevos adaptadores sin modificar las
reglas principales del dominio.

Entre las extensiones previstas se encuentran:

- API REST.
- Servidor MCP.
- Nuevos adaptadores de persistencia.
- Interfaces conversacionales.