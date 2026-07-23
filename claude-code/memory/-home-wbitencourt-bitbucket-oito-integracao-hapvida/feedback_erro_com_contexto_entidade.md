---
name: feedback-erro-com-contexto-entidade
description: "Erros de resolução/criação de entidade devem sempre carregar nome/numero_documento/tipo_documento da entidade que falhou, não só a mensagem crua da Projuris"
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 7be1a4ff-27ff-48ae-b863-aba0a56d273c
  modified: 2026-07-22T20:50:27.792Z
---

Quando um erro ocorre num fluxo que processa uma entidade específica (réu,
autor, advogado, médico, entidade adicional — qualquer chamada que passe por
`EntidadeResolverService.resolver()`), a mensagem final publicada (log +
`ErroDetalhado.message`/`raw_error` no `CadastroJuridicoOrchestratorService`)
deve indicar **qual entidade** estava sendo processada (nome, numero_documento,
tipo_documento), não só o erro cru da Projuris.

**Why:** em 2026-07-22, um erro "Documento já cadastrado" ao chamar
`/hapvida/entidade/criar` não dizia qual entidade tinha causado a falha. O
usuário teve que me perguntar "quem era" antes de eu conseguir investigar —
ele pediu explicitamente pra eu não deixar isso acontecer de novo: "quando
der erro igual a esse, retorne no erro qual foi a entidade e os dados dessa
entidade, [não] fique sem saber quem era e te perguntei".

**How to apply:**
- Implementado via `ErroComContextoEntidade` (interface exportada em
  `entidade-resolver.service.ts`) — `EntidadeResolverService.resolver()` agora
  captura qualquer erro do fluxo interno (`resolverInterno`) e anexa
  `contextoEntidade: { nome, numero_documento, tipo_documento }` no próprio
  objeto de erro antes de relançar, preservando o tipo original (ex.:
  `ProjurisApiError` continua passando no `instanceof` checks do
  orchestrator).
- `CadastroJuridicoOrchestratorService.mensagemAmigavel()` e
  `.serializarErro()` leem esse campo (se presente) e anexam ao texto/objeto
  final publicado na fila de saída.
- Esse padrão (anexar contexto de domínio ao erro, sem perder o tipo/stack
  original) deve ser reaproveitado em outros pontos do orchestrator que
  processam itens de uma lista (ex.: eventos, requisições, atributos) se um
  problema parecido aparecer — erro genérico sem dizer qual item da lista
  falhou é o padrão a evitar daqui pra frente.
- **Já reaplicado uma vez, ainda em 2026-07-22**: `DocumentoProcessoService.cadastrarDocumentos`
  (loop sobre `arquivos_processo`) tinha o mesmo problema — erro de
  `tipo_documento_processo` não resolvido não dizia qual arquivo. Mesmo
  mecanismo: `ErroComContextoArquivo` (`documento-processo.service.ts`),
  contexto `{ nome_arquivo, tipo_documento_processo, s3_bucket, s3_key }`,
  corpo do loop extraído pra `cadastrarUmDocumento` privado e envolvido em
  try/catch. Orchestrator generalizado para juntar `formatarContextoEntidade`
  + `formatarContextoArquivo` na mensagem, e mesclar `entidade`/`arquivo` no
  `serializarErro`. Se aparecer um terceiro caso (eventos, requisições,
  atributos), seguir o mesmo molde: interface `ErroComContexto<X>` exportada
  do service, loop extraído pra método privado, try/catch por item, mais um
  `formatarContexto<X>` no orchestrator.
