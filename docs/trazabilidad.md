# Matriz de trazabilidad

La siguiente matriz relaciona los requisitos principales del sistema con
los casos de uso, las clases o módulos que participan en su implementación
y las pruebas que verifican su comportamiento.

| Requisito | Caso de uso | Clase / módulo | Prueba |
|---|---|---|---|
| R1: Gestionar créditos y su ciclo de vida | Aprobar / Rechazar / Desembolsar / Entrar en mora / Regularizar / Reestructurar / Cancelar / Declarar incobrable | `CreditoState` / `EstadoCredito` | `estado-credito.test.ts` / `desembolsar-credito.test.ts` |
| R2: Otorgar créditos con plan de cuotas | Generar plan de amortización | `PlanAmortizacion` | `plan-amortizacion.test.ts` |
| R3: Registrar pagos aplicando prelación | Registrar pago | `RegistrarPago` / `PrelacionPago` | `registrar-pago.test.ts` / `prelacion-pago.test.ts` |
| R4: Calcular mora e interés moratorio | Calcular mora | `CalculadoraMora` / `PoliticaMora` | `calculadora-mora.test.ts` / `politica-mora.test.ts` |
| R5: Consultar indicadores de cartera | Consultar cartera | `ConsultarCartera` / `Cartera` | `cartera.test.ts` |
| R6: Generar cierre de cartera | Generar cierre | `GenerarCierre` / `Cartera` | `generar-cierre.test.ts` |
| R7: Representar importes monetarios sin errores de punto flotante | Operaciones financieras | `Dinero` | `dinero.test.ts` |
| R8: Persistir créditos mediante una abstracción reemplazable | Desembolsar crédito / Registrar pago | `CreditoRepository` / `CreditoRepositoryMemoria` | `desembolsar-credito.test.ts` / `registrar-pago.test.ts` |
| R9: Exponer contratos de integración para las operaciones principales | Registrar pago / Consultar cartera / Desembolsar crédito / Generar cierre | `openapi.ts` / `schemas.ts` / `validar.ts` / `generar.ts` | `contrato.test.ts` / `openapi.test.ts` |

## Criterio de trazabilidad

Cada requisito se relaciona con uno o más casos de uso, con las clases o
módulos responsables de implementar la regla correspondiente y con las
pruebas que proporcionan evidencia de su comportamiento.

La implementación mantiene separación de responsabilidades entre dominio,
aplicación, puertos, adaptadores y contratos.

La trazabilidad se establece sobre los componentes y pruebas realmente
presentes en el proyecto.