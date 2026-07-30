---
name: erro-detalhado-raw-error-padronizado
description: "ErroDetalhado.raw_error agora é sempre ItemErroDetalhado[] ({campo?, valor?, mensagens, stack?, entidade?, arquivo?}), nunca mais objeto solto; step prioriza erro.step explícito em vez de heurística split(':')"
metadata: 
  node_type: memory
  type: project
  originSessionId: 14740a67-db13-414c-a24e-2fb92f1d1223
  modified: 2026-07-24T16:52:13.978Z
---

Em 2026-07-24, `ErroDetalhado.raw_error` (`src/contracts/outputs/erro-detalhado.dto.ts`)
deixou de ser `unknown` e virou `ItemErroDetalhado[]` — sempre um array,
nunca mais um objeto solto tipo `{name, message, stack}`.

**Why:** o usuário notou que `raw_error` ora vinha como array (erro de
validação de payload, via `achatarErrosValidacao`), ora como objeto (erro de
execução, via `serializarErro` em `erro-detalhado.util.ts`) — inconsistência
que dificultava consumir o log/output de forma genérica. Também notou que
`step` às vezes duplicava o `message` inteiro (heurística
`error.message.split(':')[0]` falha quando a mensagem não tem `:`).

**How to apply:**
- `ItemErroDetalhado = { campo?, valor?, mensagens: string[], stack?, entidade?, arquivo?, path?, status?, data? }`.
  `campo`/`valor` só são preenchidos quando dá pra apontar exatamente qual
  pedaço do payload causou o erro — nunca inventar um valor.
- `identificarStep` em `erro-detalhado.util.ts` agora prioriza
  `(error as ErroComStep).step` explícito, e só cai no fallback
  `split(':')[0]` (best-effort, herdado) se o thrower não anexar `.step`.
  **Qualquer novo serviço que lança erro deve anexar `.step` explícito**
  (ex: `'objeto_processo_criar'`) — não depender do fallback.
- Mesmo mecanismo de "anexar contexto ao erro antes de relançar" que já
  existia pra entidade ([[advogado-adverso-vs-principal-entidade-vs-usuario]]
  e `feedback_erro_com_contexto_entidade`) e arquivo
  (`DocumentoProcessoService`) ganhou um terceiro caso:
  `ObjetoProcessoService` (`objeto-processo.service.ts`) agora envolve cada
  iteração do loop de `lista_pedidos` em try/catch e anexa
  `ErroComContextoPedido.contextoPedido = { indice, objeto }` +
  `.step = 'objeto_processo_criar'` antes de relançar. Isso faz o erro
  "Não foi possível resolver X na resposta da API" citar
  `lista_pedidos[N].dados_gerais.objeto` no `raw_error.campo`, igual ao que
  já acontecia pra entidade/arquivo.
- **Não foi feita uma varredura completa da aplicação** anexando `.step` em
  todo lugar que lança erro — só o caso do `ObjetoProcessoService` (o que foi
  reportado). Outros serviços que hoje não anexam `.step` continuam caindo no
  fallback herdado; se aparecer outro `step` estranho/duplicado, o padrão a
  seguir é o mesmo: anexar `.step` explícito no ponto onde o erro nasce, não
  mexer em `identificarStep`.
