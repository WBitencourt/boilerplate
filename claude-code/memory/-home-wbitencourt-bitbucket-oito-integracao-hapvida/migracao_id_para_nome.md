---
name: migracao-id-para-nome
description: "Iniciativa em andamento para trocar IDs numéricos do Projuris no payload do worker por nomes/razões sociais legíveis, campo por campo"
metadata: 
  node_type: memory
  type: project
  originSessionId: 3bbbe854-20dc-4a7b-b3f6-352950a2cace
  modified: 2026-07-22T22:59:23.916Z
---

O usuário está migrando o contrato do payload de `integracao-hapvida`
(`CadastroJuridicoHapvidaPayloadDto`), campo por campo, pra parar de exigir
IDs numéricos brutos do Projuris (que só quem já consultou manualmente sabe)
e passar a aceitar nomes/razões sociais legíveis, que o próprio worker
resolve pra ID chamando a API antes de usar.

**Por quê:** IDs numéricos como `id_unidade_organizacional: 24` não são
autoexplicativos pra quem monta o payload — só descobrindo via consulta
manual no Projuris/Postman. Trocar por nome deixa o payload legível e ainda
assim resolve pro ID certo internamente.

**Como aplicar — fluxo de 3 passos, repetido por campo:**
1. Confirmar (ou criar, se não existir) o endpoint "consultar por nome"
   correspondente no `everest-prod-external_api-v2` (`src/hapvida/`) — testar
   direto via `curl` contra `localhost:3000` antes de tocar no código deste
   repo.
2. Ajustar o fixture JSON em `fixtures/sqs/*.json` (neste repo) pra mandar o
   nome no lugar do ID nesse campo específico.
3. Ajustar o código de `integracao-hapvida`: adicionar o método no
   `ProjurisGateway` (`src/gateways/http/projuris.gateway.ts` +
   `projuris-api.types.ts`), resolver nome→ID em
   `ReferenciaResolverService` (`src/cadastro-juridico/referencia-resolver.service.ts`,
   segue o mesmo padrão de jurisdição/UF/tribunal — sem fallback de criação,
   é dado de referência puro), e propagar o ID resolvido pros pontos que hoje
   usam o campo direto do payload.

**Campos já migrados (referência de padrão):**
1. `id_unidade_organizacional` → `unidade_organizacional` (nome), resolvido
   via `POST /hapvida/unidade/consultar`.
2. `id_grau_urgencia` (antes decidido por uma regra interna
   `possuiEventoAudiencia ? 4 : 2`, sem validação nenhuma contra o Projuris)
   → campo novo `grau_urgencia` (nome, ex. "Urgente") no payload, resolvido
   via `POST /hapvida/grau_urgencia/consultar`. A regra interna baseada em
   `possuiEventoAudiencia` foi removida por completo (ficou redundante) —
   inclusive tirado de `EventoProcessoService`/orchestrator, já que não tinha
   outro consumidor.

Ambos endpoints já existiam no `everest-prod-external_api-v2`, não precisou
criar nenhum ainda. Ver [[projuris-campo-kebab-case]] pro padrão de nomes de
campo na resposta (`id-unidade-organizacional`, `id-grau-urgencia`, kebab-case).

3. `contrato_plano` → resolvido via `POST /hapvida/contrato_plano/consultar`
   (LtContratoPlanoCustomWS). Em 2026-07-22 o campo de payload foi renomeado
   pra `outras_informacoes.tipo_contrato` (só nesta aplicação — endpoint,
   método do gateway e nome interno `idContratoPlanoCustom` continuam iguais,
   pois seguem a nomenclatura da Projuris, não a do payload).
4. `dados_gerais.classificacao_processo` (endpoint `LtProcessoCustomWS`,
   `POST /hapvida/classificacao_processo/consultar`, já existia pronto no
   `everest-prod-external_api-v2`) — adicionado em 2026-07-22. Pegadinha
   confirmada via XML de consulta bruta de processo: o campo de ID retornado
   pela Projuris é `id-processo-custom`, não `id-classificacao-processo-custom`
   (o nome do WS/endpoint usa "processo", não "classificação"). Campo
   obrigatório no DTO, resolvido em `ReferenciaResolverService` igual aos
   demais (Padrão A).

**Categoria à parte — não é migração de ID, é passthrough direto de data:**
`outras_informacoes.data_inicio_multa` (par `_iso`/`_br`, adicionado em
2026-07-22) não tem endpoint de consulta — é só formatado (DD/MM/AAAA, mesmo
padrão dos outros campos de data) e repassado direto pra Projuris como
`data-inicio-multa-custom`, sem passar pelo `ReferenciaResolverService`. Não
confundir com os campos ID→nome desta lista.

5. `dados_gerais.parametro_data_fator_gerador` (endpoint `LtParametroDataCustomWS`)
   — adicionado em 2026-07-22, **primeiro campo desta iniciativa onde o
   endpoint não existia** no `everest-prod-external_api-v2` (só recebi as
   duas tags SOAP de consultar/listar, sem o campo de ID do XML de escrita).
   Criado do zero: DTO (`HapvidaParametroDataConsultarDto`/`ListarDto` em
   `classificacao.dto.ts`), rotas em `hapvida.controller.ts`, métodos em
   `hapvida.service.ts` (`contexto = 'lt-parametro-data-custom'`, filtro
   `vc:"${dto.nome}"`, seguindo o padrão de `contrato_plano`) e as env vars
   `{PROD,DEV}_BASE_URL_HAPVIDA_LTPARAMETRODATACUSTOM`. O nome do campo de ID
   (`id-parametro-data-custom`) foi um chute por analogia com os demais
   `LtXxxCustomWS` (confirmado pelo usuário como aceitável sem a tag real) —
   **confirmado certo depois via curl direto** contra `/parametro_data_fator_gerador/listar`
   local. Valores válidos são um conjunto fechado de 5: `INTIMAÇÃO`, `NÃO SE
   APLICA`, `NEGATIVA`, `SAC/NIP`, `SOLICITAÇÃO` — `"A INFORMAR"` **não é
   válido** aqui (diferente da maioria dos outros campos de nome livre desta
   app); as fixtures usam `"NÃO SE APLICA"` como default neutro.

Nos casos acima (`tipo_contrato`, `classificacao_processo`,
`data_inicio_multa`, `parametro_data_fator_gerador`), o `everest-prod-external_api-v2` também precisou de
ajuste: o builder de XML de `desdobramento/criar`
(`generateRequestCriarDesdobramento` em `src/hapvida/api_service.service.ts`)
não emitia as tags `<id-processo-custom>`/`<data-inicio-multa-custom>` antes
disso — resolver o ID/data neste app sozinho não bastava, porque a tag nunca
chegava no XML enviado à Projuris. Vale sempre conferir esse arquivo (e o DTO
`src/hapvida/dto/desdobramento.dto.ts`) ao migrar um campo novo, mesmo que o
endpoint de consulta já exista.

**Importante — nem todo hardcode é candidato a essa migração.** Ao revisar
`requisicao.service.ts`, distinguimos duas categorias (confirmado com o
usuário):
- **IDs de negócio chumbados sem validação** (ex.: `ID_GRAU_URGENCIA_*`) —
  candidatos a migrar.
- **Nomes de campo/config do Projuris usados só como chave de busca**
  (`NOME_ATRIBUTO_*` em `requisicao.service.ts`/`processo-atributo.service.ts`,
  `NOME_EVENTO_*` em `evento-processo.service.ts`) — **não migram**. O valor
  de negócio em si já vem do payload (ex. `atributo_subsidio_urgente`); o
  nome do atributo é config fixa do tenant Projuris, análogo ao de-para de
  `tipo_documento` → `ID_TIPO_DOCUMENTO_POR_TIPO` (`src/payload/dto/tipo-documento.ts`),
  que também é uma exceção aceita e não deve ser removida.

**Fora do escopo por enquanto:** `id_unidade_organizacional_cent`,
`id_escritorio_custom`, `id_grupo_responsavel_custom` e demais IDs brutos —
só migram quando o usuário pedir explicitamente, um de cada vez.
