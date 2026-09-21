# Informe de Impacto SOLID — Proyecto 2

## 1. Punto de partida

El punto de partida de Proyecto 2 corresponde a la implementación
entregada en Proyecto 1 del Sistema de Gestión de Microcrédito.

La evolución realizada en Proyecto 2 mantiene el núcleo funcional
existente y extiende el dominio principalmente en las áreas de:

- política de mora;
- cálculo de interés moratorio escalonado;
- coexistencia de políticas de mora;
- cargo de cobranza;
- interés en suspenso;
- gestión de cartera y desglose por tramo;
- estados del crédito;
- pruebas automatizadas y contratos de las políticas.

La evolución se realizó procurando conservar el comportamiento
previamente establecido en Proyecto 1.

Como evidencia, la suite automatizada final ejecuta 14 archivos de
pruebas con 92 pruebas aprobadas de 92 ejecutadas.

El punto de partida corresponde al código entregado en Proyecto 1,
identificado mediante el commit/tag de entrega:

`8d6f22b` — `Proyecto 1 - Sistema de Gestión de Microcrédito`

---

## 2. Métricas del cambio

La comparación contra el punto de partida de Proyecto 1 presenta los
siguientes resultados, obtenidos mediante `git diff --cached --stat`
sobre el conjunto final preparado para la entrega:

| Métrica | Resultado |
|---|---:|
| Archivos modificados | 31 |
| Líneas insertadas | 2,383 |
| Líneas eliminadas | 335 |
| Cambio neto | +2,048 líneas |

La distribución general del cambio comprende documentación, código
fuente y pruebas automatizadas.

Dentro del código fuente se incorporaron nuevas responsabilidades de
dominio relacionadas con políticas de mora y cargo de cobranza, además
de modificaciones a componentes existentes para soportar los nuevos
requisitos de Proyecto 2.

Dentro de las pruebas se incorporaron casos específicos para mora
escalonada, coexistencia de políticas, cargo de cobranza, interés en
suspenso, cartera y contrato de las políticas.

La métrica de cambio se mantiene respaldada por la salida de Git y no
por una estimación manual.

---

## 3. Evolución funcional

### 3.1 Política de mora escalonada

Se incorporó el contrato `PoliticaMora` junto con implementaciones para
política plana y política escalonada.

Las implementaciones principales son:

- `PoliticaPlana`;
- `PoliticaEscalonada`.

Esto permite representar diferentes políticas de mora mediante una
abstracción común sin modificar el contrato utilizado por los
consumidores.

También se incorporó `SelectorPoliticaMora`, encargado de seleccionar
la política correspondiente según su fecha de vigencia.

La política plana mantiene la regla establecida en Proyecto 1,
mientras que la política escalonada calcula el interés recorriendo los
tramos correspondientes al período de atraso.

---

### 3.2 Cálculo de mora

El cálculo de mora fue evolucionado para trabajar con los tramos
recorridos durante el período de atraso, evitando aplicar
retroactivamente la tasa del tramo actual sobre todos los días.

La implementación realiza el cálculo mediante las políticas de mora y
mantiene el redondeo monetario al final del cálculo.

También se contempla el interés en suspenso para el período posterior
al límite establecido para el reconocimiento de interés corriente.

`CalculadoraMora` fue modificada para integrar el uso de políticas y
para controlar el cálculo del interés en suspenso.

Esta modificación constituye una excepción al objetivo de mantener
intacto el consumidor, pero se documenta explícitamente como parte de
la evolución realizada.

---

### 3.3 Cargo de cobranza

Se incorporó `CargoCobranza` como responsabilidad de dominio
independiente.

El cargo de Q25 se genera cuando corresponde según los días de atraso
y se controla que no sea generado nuevamente cuando ya fue registrado.

Además, el cargo fue integrado al flujo de `RegistrarPago`.

La regla cuenta con pruebas unitarias y pruebas relacionadas con su
integración al flujo de pago.

---

### 3.4 Interés en suspenso

Se incorporó el manejo del interés en suspenso dentro del modelo de
crédito y del flujo de registro de pagos.

Cuando corresponde suspender el reconocimiento del interés, el monto
puede mantenerse en `interesEnSuspenso`.

Durante la regularización del crédito, el interés acumulado puede ser
reconocido mediante el flujo de pago correspondiente.

La implementación incluye pruebas para el comportamiento alrededor del
día 90 y día 91, así como para evitar resultados negativos de interés
en suspenso.

---

### 3.5 Cartera

La consulta de cartera fue ampliada para exponer el desglose por tramo
de mora.

La implementación distingue entre:

- cartera en riesgo;
- cartera en atraso;
- cartera excluida por condición de incobrable.

También se incorpora el desglose de riesgo por tramo, permitiendo que
la información de clasificación sea entregada por el dominio sin
confundir el concepto de atraso con el concepto de riesgo.

Las pruebas reproducen los valores establecidos por el caso de
referencia de cartera y verifican el comportamiento posterior a la
declaración de un crédito como incobrable.

---

### 3.6 Estados del crédito

Se incorporó el comportamiento de transición desde `en_mora` hacia
`cancelado`, sujeto a la liquidación correspondiente del crédito.

La transición se encuentra cubierta mediante pruebas automatizadas.

---

## 4. Análisis SOLID

### 4.1 Single Responsibility Principle (SRP)

La evolución incorpora clases y servicios con responsabilidades
específicas dentro del dominio.

Entre ellos se encuentran:

- `CargoCobranza`, encargado de determinar y generar el cargo de
  cobranza;
- `PrelacionPago`, encargado de distribuir un pago según el orden
  establecido;
- `Cartera`, encargada del cálculo y clasificación de la cartera;
- las implementaciones de `PoliticaMora`, encargadas de representar
  diferentes políticas de mora.

Esta separación permite localizar las reglas correspondientes a cada
responsabilidad en componentes específicos.

Como punto de fricción, `RegistrarPago` concentra actualmente varias
reglas de integración, entre ellas la aplicación del pago, el
reconocimiento de interés en suspenso y la generación del cargo de
cobranza.

Esto representa un área susceptible de una futura refactorización si
el flujo continúa creciendo.

---

### 4.2 Open/Closed Principle (OCP)

La introducción de `PoliticaMora` permite extender el comportamiento
mediante nuevas implementaciones de la política sin modificar el
contrato utilizado por los consumidores.

Actualmente se cuenta con las siguientes implementaciones destinadas
al comportamiento del dominio:

- `PoliticaPlana`;
- `PoliticaEscalonada`.

El `SelectorPoliticaMora` permite seleccionar la política
correspondiente según su fecha de vigencia.

La prueba de contrato verifica las operaciones comunes de las
políticas.

Debe señalarse que `CalculadoraMora` fue modificada durante Proyecto 2
para integrar el comportamiento requerido por la evolución. Por ello,
el impacto sobre OCP se documenta de manera explícita en lugar de
afirmar que el consumidor permaneció completamente intacto.

---

### 4.3 Liskov Substitution Principle (LSP)

Las políticas concretas implementan el mismo contrato
`PoliticaMora` y pueden ser utilizadas mediante dicha abstracción.

La prueba de contrato ejecuta una batería común sobre las
implementaciones:

- `PoliticaPlana`;
- `PoliticaEscalonada`;
- `PoliticaRetroactiva`.

`PoliticaRetroactiva` se incorpora exclusivamente como implementación
de prueba para verificar la sustituibilidad del contrato y contrastar
el comportamiento escalonado con un cálculo retroactivo.

No forma parte de la selección productiva de políticas de mora.

Además de las operaciones básicas del contrato, las pruebas de
Proyecto 2 verifican propiedades del cálculo como monotonicidad,
límite del interés moratorio respecto al capital y comparación del
interés escalonado frente al cálculo retroactivo.

Estas pruebas proporcionan evidencia automatizada sobre el
comportamiento común esperado de las implementaciones.

---

### 4.4 Interface Segregation Principle (ISP)

Los puertos de aplicación y las interfaces utilizadas por el núcleo
mantienen contratos orientados a las necesidades concretas de los
casos de uso.

Por ejemplo, `CreditoRepository` expone las operaciones necesarias para
buscar y guardar créditos, evitando que los casos de uso dependan
directamente de detalles de almacenamiento.

Esta separación mantiene las dependencias de los consumidores
limitadas a las operaciones que necesitan.

Los puertos de los casos de uso también permiten mantener separadas
las responsabilidades de aplicación de los detalles de infraestructura.

---

### 4.5 Dependency Inversion Principle (DIP)

Los casos de uso dependen de abstracciones, como `CreditoRepository`,
en lugar de depender directamente de una implementación concreta de
persistencia.

La implementación en memoria puede utilizarse como adaptador para las
pruebas sin modificar la lógica principal del caso de uso.

Esto permite probar la lógica de aplicación sin acoplarla a una
tecnología específica de almacenamiento.

---

## 5. Fricciones encontradas

Durante la evolución se identificaron principalmente las siguientes
fricciones:

1. La incorporación del interés en suspenso requirió extender el
   modelo de `Credito` y adaptar el flujo de `RegistrarPago` para
   reconocer dicho saldo durante la regularización.

2. La incorporación automática del cargo de cobranza requirió
   integrar una nueva regla de dominio con el flujo existente de
   registro de pagos.

3. La evolución de la política plana hacia una política escalonada
   requirió mantener compatibilidad con los valores establecidos en
   Proyecto 1 y, al mismo tiempo, permitir la coexistencia de ambas
   políticas.

4. La ampliación de las pruebas requirió actualizar fixtures existentes
   para representar explícitamente el estado de interés en suspenso y
   las nuevas propiedades relacionadas con el crédito.

5. `CalculadoraMora` tuvo que evolucionar para integrar el contrato de
   políticas y el manejo asociado al interés en suspenso. Esta
   modificación debe considerarse dentro de las métricas de impacto
   sobre el núcleo.

6. `RegistrarPago` ha aumentado su responsabilidad como orquestador del
   proceso. Aunque la implementación actual funciona y está cubierta
   por pruebas, representa un posible punto de extracción de
   responsabilidades en una evolución posterior.

7. La prueba de sustituibilidad requirió una tercera implementación,
   `PoliticaRetroactiva`, utilizada únicamente para verificar el
   contrato y comparar el comportamiento con la política escalonada.
   Esta implementación no se utiliza como política productiva.

---

## 6. Resultados de pruebas

La implementación final fue verificada mediante TypeScript y Vitest.

### TypeScript

El comando:

    npm.cmd run typecheck 

finalizó correctamente, sin errores de compilación.

### Integridad del diff

El comando:

    git diff --cached --check

finalizó sin reportar errores de formato en el conjunto preparado para la entrega.

### Suite automatizada

El comando:

    npm.cmd test

produjo:

- 14 archivos de prueba aprobados de 14;
- 92 pruebas aprobadas de 92.

Resultado:

    Test Files  14 passed (14)
    Tests       92 passed (92)

La suite cubre, entre otros aspectos:

- cálculo de mora;
- políticas plana y escalonada;
- coexistencia de políticas;
- contrato de `PoliticaMora`;
- comparación con política retroactiva de prueba;
- cargo de cobranza;
- prelación de pagos;
- interés en suspenso;
- cartera y desglose por tramo;
- plan de amortización;
- desembolso;
- estados del crédito;
- contrato OpenAPI.

La prueba de contrato cubre las dos implementaciones concretas
disponibles de `PoliticaMora`: `PoliticaPlana`; 
`PoliticaEscalonada` y `PoliticaRetroactiva`. La tercera implementación 
se utiliza como política de prueba para evaluar la sustituibilidad del contrato
y no es seleccionada por el selector productivo.

Las pruebas específicas de Proyecto 2 también verifican los casos
escalonados definidos para 15, 45, 100 y 120 días de atraso, así como
las propiedades de monotonicidad y límite del interés respecto al
capital.

## 7. Evidencia de Compatibilidad con Proyecto 1

La evolución conserva los comportamientos relevantes establecidos en
Proyecto 1 mediante pruebas de regresión.

Entre los valores conservados se encuentra el interés moratorio plano
de Q7.26 para el caso de 15 días de atraso.

La política plana continúa disponible mediante PoliticaPlana, mientras
que la política escalonada se incorpora como evolución independiente.

Esto permite mantener el comportamiento anterior para los casos que
corresponden a la política vigente de Proyecto 1 y, simultáneamente,
probar la nueva política definida para Proyecto 2.

La suite completa permanece aprobada después de incorporar las nuevas
reglas.

## Conclusión

La evolución de Proyecto 2 amplía el núcleo del Sistema de Gestión de
Microcrédito manteniendo la cobertura automatizada existente.

El cambio registrado respecto al punto de partida comprende 31
archivos modificados, con 2,383 líneas insertadas y 335 eliminadas, equivalente a
un incremento neto de 2,048 líneas.

Desde la perspectiva SOLID, la evolución incorpora abstracciones para
las políticas de mora, separa responsabilidades de dominio como el
cargo de cobranza y mantiene los casos de uso desacoplados de la
persistencia mediante puertos.

El análisis también identifica áreas de posible mejora, especialmente
en la concentración de reglas de integración dentro de `RegistrarPago`
y en el impacto que tuvo la evolución de `CalculadoraMora`.

La incorporación de `PoliticaRetroactiva` permite realizar una prueba
de contrato adicional para LSP sin convertir dicha política en una
regla productiva.

Las áreas identificadas quedan documentadas como oportunidades de
evolución y no como defectos que impidan el funcionamiento actual.

La evidencia automatizada final muestra:

14 archivos de prueba aprobados;
92 pruebas aprobadas de 92 ejecutadas;
verificación de tipos exitosa;
`git diff --cached --check` sin errores.

Con ello, la implementación cuenta con evidencia automatizada de los
casos principales de Proyecto 2 y de la conservación de los
comportamientos relevantes de Proyecto 1.