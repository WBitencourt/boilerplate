---
name: fluxo-atualizacao-dispatch-tipo-payload
description: "integracao-hapvida agora despacha por tipo_payload (Cadastro vs Atualizacao) com DTOs e orchestrators separados; Atualizacao implementado em 2026-07-23, Desdobramento ainda não"
metadata: 
  node_type: memory
  type: project
  originSessionId: 7be1a4ff-27ff-48ae-b863-aba0a56d273c
  modified: 2026-07-23T20:01:27.388Z
---

Em 2026-07-23, o worker `integracao-hapvida` deixou de processar só um
formato de payload. `tipo_payload` agora dispara validação e orchestrator
diferentes:

- **`Cadastro`**: fluxo original, `CadastroJuridicoHapvidaPayloadDto` +
  `CadastroJuridicoOrchestratorService` (sem mudança de comportamento).
- **`Atualizacao`**: novo, implementado ponta a ponta. Payload enxuto —
  `{ trace_id, environment, tipo_payload: "Atualizacao", desdobramento: {
  numero_processo }, arquivos_processo?, eventos? }` (pelo menos um dos dois
  últimos precisa ter ao menos 1 item — decorator customizado
  `ArquivosOuEventosObrigatorio` em `atualizacao-juridico-hapvida-payload.dto.ts`,
  mesmo padrão de `DataIsoOuBrObrigatoria`). Lógica: só **consulta** o
  processo (nunca cria) via `DesdobramentoService.consultarExistente()`
  (novo método público, extraído do `resolver()` original); se não existir,
  `success:false` com `ErroDetalhado` claro; se existir, roda
  `EventoProcessoService.cadastrarEventos` e, se `arquivos_processo` tiver
  itens, `DocumentoProcessoService.cadastrarDocumentos` — reaproveitando os
  services que já existiam pro fluxo de Cadastro, sem duplicar lógica de
  domínio.
- **`Desdobramento`**: **ainda não implementado**. Só o fixture de exemplo
  (`fixtures/sqs/desdobramento/soft-wendell-v1.json`) e o WS real
  (`desdobramento/criar` → `DesdobramentoWS`, ver [[processo-vs-desdobramento-ws]])
  já existem. Formato provável do payload (visto no fixture, ainda não
  validado com o usuário como contrato final): `desdobramento_inicial.numero_processo`
  (processo já existente) + `desdobramento_adicional[]` (lista de novos
  desdobramentos a criar nesse processo, com os mesmos campos de
  `HapvidaCriarDesdobramentoDto`: fase, tribunal, jurisdição, uf, cidade,
  tipo_desdobramento, juiz, etc.).

**Onde mexer pra adicionar um novo `tipo_payload` no futuro** (ex.: quando
implementar Desdobramento):
1. DTO próprio em `src/payload/dto/` (não reaproveitar o DTO gigante de
   Cadastro nem usar `@ValidateIf` condicional nele — vira ilegível).
   `tipo_payload` do DTO de Cadastro está restrito a `['Cadastro']` só, de
   propósito.
2. `SqsConsumerService.validarPayload()` (em
   `src/presentation/queue/sqs-consumer.service.ts`) despacha pelo
   `tipo_payload` do JSON cru (`extrairTipoPayload`) pro DTO certo via
   `validarComDto<T>()` (genérico, reaproveitável). Hoje qualquer
   `tipo_payload` que não seja `"Atualizacao"` cai no DTO de Cadastro por
   default — inclusive `"Desdobramento"`, que vai falhar a validação com
   mensagem clara até ganhar seu próprio branch.
3. Novo orchestrator em `src/use-cases/demanda/` (só os orchestrators reais
   moram aí — ver reorganização abaixo), mesmo formato
   `executar({ payload }): Promise<ResultadoCadastroJuridicoPayload>`, erros
   formatados via `montarErroDetalhado()` (`src/utils/erro-detalhado.util.ts`)
   pra não duplicar `identificarStep`/`mensagemAmigavel`/`serializarErro`
   entre orchestrators.
4. `SqsConsumerService.executarFluxo()` ganha mais um branch (discriminated
   union por `payload.tipo_payload`), e `composition-root.ts` instancia o
   orchestrator novo e passa pro construtor do `SqsConsumerService`.

Sem framework de DI no projeto — tudo é `new` manual em
`composition-root.ts`. Não havia nenhum padrão de dispatch/strategy antes
dessa mudança; esse é o primeiro, e deve servir de referência pros próximos.

**Reorganização de pastas (mesmo dia, logo depois)**: a estrutura passou por
duas mudanças de organização, a pedido do usuário:
1. `src/use-cases/demanda/cadastro-juridico/*` → achatado pra
   `src/use-cases/demanda/*` (a subpasta `cadastro-juridico/` não fazia mais
   sentido depois que `AtualizacaoJuridicoOrchestratorService` passou a morar
   lá também — nome enganoso).
2. Depois, separação por camada (Clean Architecture — usecase não deve
   injetar outro usecase, só serviços de domínio):
   - `src/domain/demanda/` — os 9 serviços de domínio/aplicação reaproveitados
     pelos orchestrators: `entidade-resolver.service.ts`,
     `referencia-resolver.service.ts`, `desdobramento.service.ts`,
     `evento-processo.service.ts`, `documento-processo.service.ts`,
     `parte.service.ts`, `processo-atributo.service.ts`,
     `objeto-processo.service.ts`, `requisicao.service.ts`.
   - `src/use-cases/demanda/` — só os 2 orchestrators de verdade
     (`cadastro-juridico-orchestrator.service.ts`,
     `atualizacao-juridico-orchestrator.service.ts`), cada um com `executar()`
     como único ponto de entrada público (equivalente ao `execute()` de
     outras convenções).
   - `src/utils/erro-detalhado.util.ts` — saiu de `use-cases/` (era utilitário
     puro, não lógica de domínio nem use case).

   **Regra pra próximos arquivos**: serviço que resolve/consulta/cria uma
   entidade de negócio (Projuris ou não) e é injetado por um orchestrator vai
   em `src/domain/demanda/`. Só a classe que implementa o fluxo completo
   disparado pelo `tipo_payload` (o "caso de uso" em si, chamado pelo
   `SqsConsumerService`) vai em `src/use-cases/demanda/`.
