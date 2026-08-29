# Decisiones del dominio

## Representación del dinero

Todo importe monetario se manejará mediante el objeto de valor Dinero.

No se utilizará Number de punto flotante para cálculos monetarios.

La representación deberá conservar el monto y la moneda.

---

## Método de amortización

El método base será la amortización francesa de cuota fija.

La cuota se calculará considerando:
- Capital desembolsado.
- Tasa periódica.
- Número de cuotas.

Cuando la tasa sea cero, la cuota será el capital dividido entre el número de cuotas.

La última cuota se ajustará para garantizar saldo final igual a 0.00.

---

## Mora

El interés moratorio se calculará únicamente sobre capital en mora.

No se calcularán intereses sobre intereses.

---

## Cartera en riesgo

Un crédito se considera en riesgo cuando tiene al menos una cuota con más de 30 días de atraso.

Se considera el saldo completo de capital del crédito.

Los créditos reestructurados también cuentan como cartera en riesgo.

Los créditos dados de baja como incobrables no forman parte de la cartera activa.

---

## Prelación del pago

Los pagos se aplican en el siguiente orden:

1. Gastos y comisiones.
2. Interés moratorio.
3. Interés corriente.
4. Capital.

---

## Idempotencia

Registrar dos veces el mismo pago con la misma clave de idempotencia no debe alterar el saldo.