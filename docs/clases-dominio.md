# Clases del dominio

## Cliente

Representa a la persona o pequeño negocio que solicita y recibe un crédito.

Responsabilidades:
- Mantener la información del cliente.
- Identificar al cliente de forma única.
- Relacionarse con sus créditos.

---

## Credito

Representa el crédito otorgado al cliente.

Responsabilidades:
- Mantener el monto de capital.
- Mantener el plazo.
- Mantener la tasa pactada.
- Mantener el estado del crédito.
- Mantener el saldo de capital.
- Asociarse con su plan de amortización.

---

## PlanAmortizacion

Representa el plan de pagos generado para un crédito.

Responsabilidades:
- Contener las cuotas.
- Calcular la distribución de capital e interés.
- Mantener el calendario de pagos.

---

## Cuota

Representa una cuota individual del plan de amortización.

Responsabilidades:
- Identificar el número de cuota.
- Mantener su fecha de vencimiento.
- Mantener interés.
- Mantener amortización.
- Mantener saldo.

---

## Pago

Representa un pago realizado por el cliente.

Responsabilidades:
- Registrar el monto recibido.
- Registrar la fecha del pago.
- Registrar el medio de pago.
- Asociarse con un crédito.

---

## PrelacionPago

Representa la regla para distribuir un pago entre los conceptos adeudados.

Orden:
1. Gastos y comisiones.
2. Interés moratorio.
3. Interés corriente.
4. Capital.

---

## Movimiento

Representa un movimiento registrado sobre la cuenta del crédito.

Responsabilidades:
- Registrar movimientos.
- Permitir reconstruir los saldos.
- Mantener trazabilidad para auditoría.

---

## CalculadoraMora

Calcula la mora y el interés moratorio utilizando los parámetros establecidos por la política institucional.

---

## Cierre

Representa el cierre de un período y congela sus cifras a una fecha de corte.

---

## Cartera

Representa la información consolidada de la cartera de créditos y permite calcular la cartera en riesgo.

# Relaciones principales

Cliente 1 ─── 0..* Credito

Credito 1 ─── 1 PlanAmortizacion

PlanAmortizacion 1 ─── 1..* Cuota

Credito 1 ─── 0..* Pago

Pago 1 ─── 1 PrelacionPago

PrelacionPago ───> Movimiento

Credito 1 ─── 0..* Movimiento

Cartera ───> Credito

Cartera ───> Cierre

CalculadoraMora ───> Credito
CalculadoraMora ───> Cuota