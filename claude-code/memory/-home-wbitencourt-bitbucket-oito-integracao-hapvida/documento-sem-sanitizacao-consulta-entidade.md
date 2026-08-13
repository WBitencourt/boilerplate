---
name: documento-sem-sanitizacao-consulta-entidade
description: numero_documento não é sanitizado em nenhum ponto do pipeline; vai mascarado (como chega da Hapvida) até a consulta/criação na Projuris
metadata: 
  node_type: memory
  type: project
  originSessionId: e76b00ee-ec4a-450e-90b5-1093c2b62c7c
  modified: 2026-08-13T17:54:17.284Z
---

`numero_documento` (CPF/CNPJ) é enviado à API Projuris exatamente como chega no payload original da Hapvida, sem nenhuma limpeza/formatação (sem regex removendo pontos/traços/barras).

Fixtures reais mostram a Hapvida enviando com máscara (ex.: `"63.554.067/0001-98"`, `"134.960.446-16"`).

Pontos confirmados sem sanitização:
- `src/contracts/inputs/entidade-input.dto.ts:16-18` — só `@IsString()`/`@IsNotEmpty()`, sem `@Transform`.
- `src/adapters/pipeline.adapter.ts:43-59` — existe `limparEConverterParaNumero` (remove não-dígitos), mas só é usada em `ordinal_juizo`, nunca em `numero_documento`.
- `src/application/services/demanda/entidade-resolver.service.ts:87-91` — repassa `entidade.numero_documento` direto pro gateway na consulta (`entidade/consultar_by_documento`).
- `src/gateways/http/projuris.gateway.ts:141,227-229` — mesmo padrão na criação (`entidade/criar`, campo `numero-documento`).

**Why:** Confirmado via investigação de código porque não era óbvio se a consulta usava documento formatado ou não — não existe transformação em lugar nenhum do pipeline.

**How to apply:** Se surgir bug de "entidade não encontrada" por mismatch de formato de documento entre Hapvida e Projuris, checar primeiro se a Projuris espera documento mascarado ou não — o problema não estará na integração-hapvida (que não sanitiza), mas em possível divergência de formato esperado pela API de destino. Relacionado a [[projuris-campo-kebab-case]] e [[migracao_id_para_nome]].
