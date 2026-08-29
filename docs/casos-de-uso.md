# Casos de uso detallados

## CU-01 — Registrar cliente

**Actor principal:** Asesor de crédito.

**Objetivo:** Registrar un nuevo cliente en el sistema.

**Precondiciones:**
- El asesor está autorizado.
- El cliente no debe estar registrado previamente.

**Flujo principal:**
1. El asesor proporciona los datos del cliente.
2. El sistema valida los datos.
3. El sistema verifica que el cliente no exista.
4. El sistema registra al cliente.
5. El sistema devuelve el identificador del cliente.

**Resultado:** Cliente registrado correctamente.

---

## CU-02 — Solicitar crédito

**Actor principal:** Asesor de crédito.

**Objetivo:** Registrar una solicitud de crédito.

**Precondiciones:**
- El cliente existe.
- El monto solicitado está dentro de los límites establecidos.

**Flujo principal:**
1. El asesor selecciona al cliente.
2. Introduce monto, plazo y tasa.
3. El sistema valida los parámetros.
4. Se crea la solicitud.
5. El crédito queda en estado `solicitado`.

**Resultado:** Solicitud registrada.

---

## CU-03 — Evaluar / Aprobar crédito

**Actor principal:** Comité de crédito.

**Objetivo:** Determinar si una solicitud puede ser aprobada.

**Flujo principal:**
1. El comité consulta la solicitud.
2. Revisa la información necesaria.
3. El comité aprueba o rechaza.
4. El sistema registra la decisión.
5. Si se aprueba, el crédito pasa a `aprobado`.
6. Si se rechaza, pasa a `rechazado`.

---

## CU-04 — Desembolsar crédito

**Actor principal:** Asesor de crédito.

**Objetivo:** Entregar el capital aprobado al cliente.

**Precondición:**
- El crédito está aprobado.

**Flujo principal:**
1. El asesor solicita el desembolso.
2. El sistema verifica que el crédito esté aprobado.
3. Se registra el desembolso.
4. Se genera el plan de amortización.
5. El crédito pasa a `vigente`.

**Resultado:** Crédito desembolsado y plan generado.

---

## CU-05 — Registrar pago de cuota

**Actor principal:** Asesor de crédito.

**Objetivo:** Registrar y aplicar un pago.

**Flujo principal:**
1. El asesor envía el pago.
2. El sistema valida la información.
3. Se verifica la clave de idempotencia.
4. Se calcula la mora si corresponde.
5. Se aplica la prelación.
6. Se registran los movimientos.
7. Se reconstruye el saldo.
8. Se actualiza el estado del crédito.
9. Se devuelve el resultado.

**Prelación:**
1. Gastos y comisiones.
2. Interés moratorio.
3. Interés corriente.
4. Capital.

---

## CU-06 — Generar cierre

**Actor principal:** Gerencia.

**Objetivo:** Generar las cifras de cierre de un período.

**Flujo principal:**
1. Gerencia proporciona la fecha de corte.
2. El sistema verifica si ya existe un cierre.
3. Obtiene los movimientos.
4. Obtiene los créditos correspondientes.
5. Calcula mora.
6. Calcula cartera activa.
7. Calcula cartera en riesgo.
8. Calcula el porcentaje en riesgo.
9. Guarda/consolida el cierre.

---

## CU-07 — Consultar cartera en riesgo

**Actor principal:** Gerencia.

**Objetivo:** Consultar la situación de riesgo de la cartera.

**Flujo principal:**
1. Gerencia proporciona la fecha de corte.
2. El sistema obtiene los créditos correspondientes.
3. Determina los créditos en riesgo.
4. Calcula cartera activa.
5. Calcula saldo en riesgo.
6. Calcula porcentaje en riesgo.
7. Clasifica los resultados por tramo.
8. Devuelve el indicador.