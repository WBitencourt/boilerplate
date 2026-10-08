---
name: documento-sem-sanitizacao-consulta-entidade
description: consulta de entidade antes de criar busca principal (EntidadeWS) e depois documento secundário (EntidadeDocumentoWS), cada um mascarado→dígitos; duas causas reais de "Documento já cadastrado"
metadata: 
  node_type: memory
  type: project
  originSessionId: e76b00ee-ec4a-450e-90b5-1093c2b62c7c
  modified: 2026-09-14T22:42:55.342Z
---

`numero_documento` (CPF/CNPJ) é enviado à API Projuris exatamente como chega no payload original da Hapvida, sem nenhuma limpeza/formatação (sem regex removendo pontos/traços/barras) — isso continua valendo pro `entidade/criar`.

Fixtures reais mostram a Hapvida enviando com máscara (ex.: `"63.554.067/0001-98"`, `"134.960.446-16"`).

**INCIDENTE CONFIRMADO (2026-09-14):** entidade "RAFAELLA ROCHA DOS SANTOS" (CPF `703.265.011-26`) estava cadastrada na Projuris com `numero-documento-principal` **sem máscara** (`70326501126`, id-entidade 1117896). A consulta `entidade/consultar_by_documento` faz match exato (`o:"="` contra `NUMERO_DOCUMENTO_PRINCIPAL` em `everest-prod-external_api-v2/src/hapvida/hapvida.service.ts:1304`), então mandando o CPF mascarado ela dava 404, o resolver tentava criar, e a Projuris recusava com "Documento já cadastrado". Reproduzido testando os dois formatos direto contra a everest em Prod (consulta é seguro simular em prod).

**Fix aplicado** em `src/application/services/demanda/entidade-resolver.service.ts` (`EntidadeResolverService`): novo método privado `consultarIdEntidadePorDocumento` — tenta a consulta com o documento como veio; se não achar (404/null) e o valor tiver caracteres não-numéricos, tenta de novo só com dígitos (`removerFormatacaoDocumento`) antes de decidir criar. Não normaliza pra um formato único porque a base tem registros antigos com e sem máscara — normalizar sempre arriscaria não achar quem já existe com máscara. Testes cobrindo os dois cenários em `src/test/cadastro-juridico/entidade-resolver.service.spec.ts`.

**Why:** Confirmado via investigação de código + teste real contra a everest em Prod porque não era óbvio se a Projuris tinha match exato ou normalizado — a API de consulta é exata, mas o cadastro existente na base está inconsistente (alguns COM máscara, outros SEM).

**SEGUNDO INCIDENTE (2026-10-08, demanda 47979):** CPF `018.560.763-26` (MARCELO BRUNO SOUSA DE CARVALHO) estava como documento **secundário** (principal=F) da entidade 711762, cujo principal é a OAB `CE32599`. `consultar_by_documento` só filtra `NUMERO_DOCUMENTO_PRINCIPAL` → 404 nas duas formas → criar → "Documento já cadastrado" (a trava da Projuris olha todos os documentos). Existe ainda uma duplicata 1127000 (OAB CE032599) criada à mão no mesmo dia por THIAGO GIANESELLA. **Fix:** novos endpoints na external_api `entidade_documento/consultar` (EntidadeDocumentoWS, contexto `entidade-documento`, filtro `NUMERO_DOCUMENTO`, env `{ENV}_BASE_URL_HAPVIDA_ENTIDADEDOCUMENTO`) e `entidade/consultar_by_id` (filtro `ID_ENTIDADE`); o resolver agora tenta principal (2 formas) e depois secundário (2 formas) antes de criar.

**How to apply:** Se surgir de novo erro "Documento já cadastrado" no `entidade/criar` apesar de a consulta prévia não ter encontrado nada, suspeitar primeiro de mismatch de formatação — o fallback já cobre mascarado↔dígitos, mas não cobre outras inconsistências de dado sujo (espaços, zeros à esquerda faltando, etc.). Relacionado a [[projuris-campo-kebab-case]], [[migracao_id_para_nome]] e [[projuris-tribunal-espaco-sobrando-dado-sujo]] (mesma categoria: dado sujo cadastrado na Projuris que quebra busca exata).
