@"
# Matriz de trazabilidad

La siguiente matriz relaciona los requisitos principales del sistema con los casos de uso y las clases o módulos que participan en su implementación.

| Requisito | Caso de uso | Clase / módulo |
|---|---|---|
| R1: Gestionar créditos y su ciclo de vida | Aprobar / Rechazar / Desembolsar / Entrar en mora / Regularizar / Reestructurar / Cancelar / Declarar incobrable | `CreditoState` / `EstadoCredito` |
| R2: Otorgar créditos con plan de cuotas | Generar plan de amortización | `PlanAmortizacion` |
| R3: Registrar pagos aplicando prelación | Registrar pago | `RegistrarPago` / `PrelacionPago` |
| R4: Calcular mora e interés moratorio | Calcular mora | `CalculadoraMora` |
| R5: Consultar indicadores de cartera | Consultar cartera | `ConsultarCartera` / `Cartera` |
| R6: Generar cierre de cartera | Generar cierre | `GenerarCierre` / `Cartera` |
| R7: Representar importes monetarios sin errores de punto flotante | Operaciones financieras | `Dinero` |
| R8: Persistir créditos mediante una abstracción reemplazable | Desembolsar crédito / Registrar pago | `CreditoRepository` / `CreditoRepositoryMemoria` |
| R9: Exponer contratos de integración para las operaciones principales | Registrar pago / Consultar cartera / Desembolsar crédito / Generar cierre | `openapi.ts` / `schemas.ts` / `validar.ts` / `generar.ts` |

## Criterio de trazabilidad

Cada requisito se relaciona con uno o más casos de uso y con las clases o módulos responsables de implementar la regla correspondiente.

La implementación mantiene separación de responsabilidades entre dominio, aplicación, puertos, adaptadores y contratos.

La trazabilidad se establece sobre los componentes realmente presentes en el proyecto.
"@ | Set-Content .\docs\trazabilidad.md -Encoding UTF8