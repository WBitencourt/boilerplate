---
name: machine-name-galaxybook2
description: "machine_name \"galaxybook2\" em erros.prod (Everest) é o notebook do próprio usuário, não um servidor"
metadata:
  node_type: memory
  type: reference
  originSessionId: 5e5bdfef-53b9-4920-9e96-1c97cd2f1c6c
  modified: 2026-10-21T20:46:33.546Z
---

Em `erros.prod` (banco Everest), `machine_name = 'galaxybook2'` é o notebook do usuário (execução local com `ENVIRONMENT=Prod`), não uma máquina de produção. Os containers aparecem como hash (ex.: `acde62aef62e`) ou nome do serviço (`prod-consumer-plataforma_coleta`).

**Why:** em 2026-10-21, investigando citações sem pk, estranhei esse nome e fui consultar — o usuário interrompeu: "esse notebook é o meu".

**How to apply:** ao ver `galaxybook2` nos erros, tratar como execução local do usuário. Se houver suspeita de que a execução local consumiu fila de prod, perguntar ao usuário em vez de investigar a máquina.
