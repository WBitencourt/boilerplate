# Workflow

## Sync personal Claude Code config to GitHub

- Whenever personal `~/.claude` files change (`CLAUDE.md`, `settings.json`, or any `projects/*/memory/*` file), copy the changed files into `/home/wbitencourt/github/wbitencourt/boilerplate/claude-code` (mirroring the existing folder structure — memories go under `claude-code/memory/<project-slug>/`) and commit + push that repo (`git -C /home/wbitencourt/github/wbitencourt/boilerplate ...`).
- Do this proactively, right after making the change, without waiting to be asked.

## Git branch awareness

- Always check the current git branch (`git branch --show-current`) before assuming which environment (dev/prod/etc.) applies — don't reuse environment-specific values (`.env` contents, image tags, config) seen earlier in the conversation without confirming the current branch first.
- Treat "troquei de branch" (or similar) from the user as a signal to re-check context before continuing.

## Re-check code before executing it

- The developer edits files between my turns. Before running any script or command that executes project code (`npm run dev`, `tsx`, `node`, etc.), re-read the entry point and what it calls (`git diff`, file mtime, the active `main()`), and confirm it still does exactly what I intend. Never assume the code is the same as when I last edited or ran it.
- If the code changed and is no longer mine/what I expect, stop and ask before running — especially when it can write to production (DynamoDB, S3, SQS, databases).
- Prefer running one-off tasks through a separate entry file I create (e.g. `npx tsx ./_script.ts`) instead of the developer's shared entry point.

## Registrar trabalho no Notion (repos em /home/wbitencourt/bitbucket/oito)

Sempre que trabalharmos em código dentro de `/home/wbitencourt/bitbucket/oito/*` — bug, investigação,
melhoria ou automação — registrar e manter atualizada a task no database **Tasks** do Notion:

- Página: `Wendell Bitencourt` — https://app.notion.com/p/Wendell-Bitencourt-3418ef240b6a80be9b0ef2b809f2e2b7
- Database inline `Tasks` — `database_id`: `3418ef24-0b6a-800a-b2aa-f8e0c164f582`
- `data_source_id` (Notion-Version `2025-09-03`, usar em `query-data-source` / `update-a-data-source` / parent de páginas novas): `3418ef24-0b6a-81b3-8377-000b12aac40e`
- Acesso via MCP Notion (workspace **Oito Tecnologia**).

### Quando registrar

- **No início**: criar a task (ou localizar a existente) antes/junto de começar a investigar.
  Preencher `Start` com a data de hoje e `Status` = `In progress`.
- **Durante**: ao chegar numa conclusão relevante (hipótese confirmada/descartada, causa raiz achada,
  solução aplicada), atualizar o corpo da página — não esperar o fim.
- **No fim**: `Status` = `Done` e **`End` obrigatório**. Sem `End` preenchido não é possível montar o
  relatório por período, então nunca fechar uma task sem data de fim.

### Propriedades do database

| Propriedade | Tipo | Como preencher |
|---|---|---|
| `Description` | title | Título curto e buscável. Se houver nº de demanda/NIP/protocolo, prefixar: `<numero> - <resumo>` |
| `ID` | texto | Nº da demanda / UUID / protocolo. `n/a` se não houver |
| `Status` | status | `Not started`, `In progress`, `In review`, `Waiting deploy`, `Pending items`, `Stopped by another task`, `Done` |
| `Priority Level` | select | `Maxima`, `Alta`, `Media`, `Baixa` — urgência |
| `Start` / `End` | date | Início real e fim real (ver regra acima) |
| `Tipo` | select | `Bug`, `Melhoria`, `Nova feature`, `Investigação`, `Infra/Deploy`, `Automação`, `Suporte` |
| `Repositório` | multi-select | Nome da pasta em `bitbucket/oito` (ex.: `everest-prod-external_api-v2`). Pode ser mais de um |
| `Cliente/Sistema` | multi-select | `Hapvida`, `PicPay`, `Sumicity`, `Everest`, `ANS/NIP`, etc. |
| `Causa raiz` | texto | **Uma linha** — a causa real, não o sintoma |
| `Solução` | texto | **Uma linha** — o que foi feito pra resolver |
| `Impacto` | texto | Efeito prático, de preferência quantificado ("deixou de perder ~X e-mails/dia", "destravou integração do cliente Y") |
| `Severidade` | select | `Crítico (prod parado)`, `Alto`, `Médio`, `Baixo` — consequência (≠ `Priority Level`, que é urgência) |
| `Ambiente` | select | `prod`, `homolog`, `dev` |
| `Referências` | texto | Branch, commit, PR, link do Bitbucket, ARN/URL do recurso AWS |
| `Tags` | multi-select | Palavras-chave técnicas (`dynamodb`, `sqs`, `axios`, `timeout`, `cnpj-alfanumerico`) — é o que faz a busca funcionar depois |

### Corpo da página (seções fixas)

Texto longo vai **no corpo da página**, nunca nas colunas. Usar sempre estes headings, nesta ordem:

```markdown
## Contexto / Sintoma
O que foi observado, quem reportou, evidências (log, ID da demanda, print, payload).

## Diagnóstico
Discussão resumida: hipóteses levantadas, o que foi testado, o que foi descartado e por quê.
Registrar o raciocínio — é isso que responde "como vocês chegaram nessa conclusão?".

## Causa raiz
A causa real, com o ponto exato no código (`arquivo.ts:linha`, função, query, config).

## Solução aplicada
O que mudou: arquivos, funções, migração, variável de ambiente. Branch/commit.

## Como validamos
Teste, execução, log ou consulta que comprova que resolveu. Em qual ambiente.

## Impacto
Efeito no negócio/operação, quantificado quando possível.

## Pendências / follow-up
O que ficou de fora, débito técnico, risco remanescente.

## Histórico
- 2026-10-19 — início da investigação
- 2026-10-20 — causa raiz identificada
- 2026-10-21 — deploy em prod, validado
```

- Sempre datas absolutas (`2026-10-19`), nunca "ontem"/"semana passada".
- Manter o `## Histórico` em ordem cronológica, uma linha por marco.

### Objetivo final

Os dados servem a dois usos — escrever pensando neles:

1. **Consulta pontual**: "o que foi aquele bug do X?" → achar pelo título/`Tags`/`Causa raiz` e ter a
   história inteira na página.
2. **Relatório periódico pro chefe**: filtrar por `Start`/`End` num período e mostrar volume por
   `Tipo`/`Cliente/Sistema` e o `Impacto` de cada entrega. O formato do relatório ainda será definido —
   por isso a prioridade é ter os dados completos e consistentes agora.

# Code Style

## Function declarations

- Use `function` declarations for all top-level functions.
- Use arrow functions only when defining a function **inside** another function.

```ts
// correct
function handleClick() { ... }

// correct — arrow inside a function
function setup() {
  const onClick = () => { ... };
}

// avoid
const handleClick = () => { ... };
```

## Function parameters

- Always receive parameters as a single object, never as separate positional params.
- Always create an interface for that object.
- Destructure the object in the function body.

```ts
// correct
interface CreateUserParams {
  name: string;
  email: string;
}

function createUser({ name, email }: CreateUserParams) { ... }

// avoid
function createUser(name: string, email: string) { ... }
```

## Event handlers

- Never use inline arrow functions for events.
- Always create a named handler function prefixed with `handle` + event name.

```tsx
// correct
function handleOnClick() { ... }
function handleOnMouseOver() { ... }

<button onClick={handleOnClick} onMouseOver={handleOnMouseOver} />

// avoid
<button onClick={() => { ... }} />
```

## Conditional statements

- Always use braces `{}` with `if` statements, never use one-liners.
- Always break to a new line.
- Prefer using `else` when possible to make the code flow clearer. Only avoid `else` if it makes the code significantly simpler (e.g., early returns).

```ts
// correct
if (condition) {
  doSomething();
} else {
  doOtherThing();
}

// acceptable with early return
if (!isValid) {
  return false;
}

// avoid
if (!/^[0-9A-Z]{12}$/.test(body)) return false;
```

## Arrow functions

- Always use explicit `return` statements in arrow functions, even in short callbacks like `filter`, `map`, etc.
- Never use implicit returns (shorthand syntax without braces).

```ts
// correct
array.filter((item) => {
  return item.id > 5;
});

array.map((user) => {
  return user.name.toUpperCase();
});

// avoid
array.filter((item) => item.id > 5);
array.map((user) => user.name.toUpperCase());
```

## Regex patterns

- Always create a named variable with a clear, descriptive name that explains what the regex validates.
- Use the variable in conditional statements instead of inline regex.

```ts
// correct
const matchAlphaNumeric = /^[0-9A-Z]{12}$/.test(body);
if (!matchAlphaNumeric) {
  return false;
}

// avoid
if (!/^[0-9A-Z]{12}$/.test(body)) {
  return false;
}
```

## HTTP requests (Axios)

- Configure the Axios instance with `validateStatus: () => true` so it never throws based on HTTP status — only real network/timeout failures should reject the promise.
- Centralize the status-code decision in one place (e.g. a single gateway/client method that every call goes through), not scattered across every call site.
- In that one place, inspect `response.status` and decide explicitly: 2xx returns the data; a status that means "expected empty result" (e.g. 404 for "not found") returns normally without throwing; any other non-2xx status throws a domain-specific error.
- Callers downstream should never see Axios or its exceptions directly — they just get data, `undefined`, or a domain error.

```ts
// correct — axios.lib.ts
export function criarAxiosInstance({
  baseURL,
  timeout,
}: CriarAxiosInstanceParams): AxiosInstance {
  return axios.create({
    baseURL,
    timeout,
    validateStatus: () => {
      return true;
    },
  });
}

// correct — single gateway method every request goes through
async function post<TResponse>({ path, body }: PostParams): Promise<TResponse> {
  let response;

  try {
    response = await http.post<TResponse>(path, body);
  } catch (error) {
    throw new ApiError({ path, cause: error as Error });
  }

  if (response.status >= 200 && response.status < 300) {
    return response.data;
  }

  if (response.status === 404) {
    return undefined as TResponse;
  }

  throw new ApiError({ path, status: response.status, data: response.data, cause: new Error(`Request failed with status code ${response.status}`) });
}

// avoid — letting axios throw on every non-2xx and catching it ad hoc at each call site
try {
  const response = await http.post(path, body);
  return response.data;
} catch (error) {
  if (axios.isAxiosError(error) && error.response?.status === 404) {
    return undefined;
  }
  throw error;
}
```

## Variable spacing

- Add a blank line between variable declarations to improve readability and prevent code from looking cluttered.

```ts
// correct
const name = "John";

const email = "john@example.com";

const age = 30;

// avoid
const name = "John";
const email = "john@example.com";
const age = 30;
```
