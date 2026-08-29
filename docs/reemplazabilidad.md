# Componentes reemplazables

## Repositorio de créditos

### Abstracción
CreditoRepository.

### Implementaciones posibles
- Repositorio en memoria.
- PostgreSQL.
- Otro sistema de persistencia.

### Beneficio
El dominio no depende de una tecnología específica.

---

## Reloj

### Abstracción
Clock.

### Implementaciones
- Reloj real.
- Reloj fijo para pruebas.

### Beneficio
Permite pruebas reproducibles y evita depender directamente
de la fecha/hora del sistema.

---

## Estrategia de cálculo

### Abstracción
Estrategia de interés/amortización.

### Implementaciones
- Amortización francesa.
- Futuras políticas de cálculo.

### Beneficio
Permite evolucionar las políticas sin modificar el núcleo.