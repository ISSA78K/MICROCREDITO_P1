# Estados del crédito

## Estados

- solicitado
- aprobado
- rechazado
- vigente
- en_mora
- reestructurado
- cancelado
- incobrable

## Principales transiciones

solicitado → aprobado

solicitado → rechazado

aprobado → vigente

vigente → en_mora

en_mora → vigente

en_mora → reestructurado

en_mora → incobrable

vencido → reestructurado

reestructurado → vigente

vigente → cancelado

reestructurado → cancelado
