# 1. RBAC (Role-Based Access Control)

Acesso baseado em **papel/cargo**: o sistema só enxerga "este usuário tem a role X" e "a role X tem as permissões Y". Não há regra por contexto nem por atributo do recurso — é uma lista fixa de permissões (ex: `"user:create"`, `"curso:admin"`). Simples, mas pouco flexível para regras do tipo "só pode editar o próprio registro".

# 2. ABAC (Attribute-Based Access Control)

Acesso baseado em **atributos**: a decisão usa quem é o usuário, qual é o recurso e o contexto (país, horário, status do recurso, etc.). Em vez de "Admin pode tudo", você define regras como "pode fazer *update* em *user* nos campos *name, email* **se** *country = Brazil*". Mais expressivo que RBAC e alinhado ao modelo de políticas do AWS IAM.

# 2.1. Anatomia do JSON (Terminologia Técnica)
- **Effect (Efeito):** "Allow" ou "Deny". Define se a política concede ou nega acesso.
- **Action (Ação):** O "verbo". Define a operação (ex: update, manage, read).
- **Subject (Assunto/Recurso):** O "substantivo". Define em qual entidade a ação atua.
- **Fields (Camadas/Atributos):** Também chamado de Fine-grained access (acesso fino). Define a granularidade da permissão em nível de coluna/propriedade.
- **Conditions (Condições/Predicados):** Define o Escopo. É onde a lógica de negócio entra (ex: "só se o status for aberto").

# 3. Banco de dados

Schema: `roles/abac.prisma`.

## 3.1. Como funcionam os relacionamentos

- **users** e **roles** são ligados pela tabela **user_roles** (pivot). Um usuário pode ter várias roles; uma role pode pertencer a vários usuários. Exemplo: *Wendell* pode ser RH e TI; *João* pode ser Suporte; a role *TI* pode ser atribuída a Wendell e a outros.
- Cada **role** tem suas políticas ABAC em **role_permissions** (uma linha = um statement: effect, action, subject, fields, conditions). São as permissões padrão de quem tem aquela role.
- **user_permissions** são exceções ou extras por usuário. Se precisar "Wendell também pode fazer X" ou "João está negado em Y", você adiciona uma linha aqui. Na hora de resolver o acesso, você junta as role_permissions (de todas as roles do usuário) com as user_permissions; em geral deny vence allow.

Resumindo: **User ↔ Role** (N:N via **user_roles**), **Role → RolePermission** (1:N), **User → UserPermission** (1:N).

## 3.2. Dados de exemplo (fictícios)

Roles: **RH**, **Suporte**, **TI**. Usuários: **Wendell Bitencourt**, **João Frango**.

**users**

| id  | name              | email                    |
| --- | ----------------- | ------------------------ |
| u1  | Wendell Bitencourt | wendell@example.com      |
| u2  | João Frango        | joao.frango@example.com  |

**roles**

| id  | name    |
| --- | ------- |
| r1  | RH      |
| r2  | Suporte |
| r3  | TI      |

**user_roles** (quem tem qual role)

| userId | roleId |
| ------ | ------ |
| u1     | r1     |
| u1     | r3     |
| u2     | r2     |

→ Wendell tem as roles RH e TI. João tem a role Suporte.

**role_permissions** (políticas ABAC por role)

| roleId | effect | action | subject | fields        | conditions  |
| ------ | ------ | ------ | ------- | ------------- | ----------- |
| r1     | allow  | read   | user    | null          | null        |
| r1     | allow  | update | user    | ["name","email"] | {"department":"RH"} |
| r2     | allow  | read   | chamado | null          | null        |
| r2     | allow  | update | chamado | ["status"]    | null        |
| r3     | allow  | read   | user    | null          | null        |
| r3     | allow  | manage | chamado | null          | null        |

→ RH pode ler user e atualizar name/email quando department é RH. Suporte pode ler chamado e atualizar status. TI pode ler user e gerenciar chamado.

**user_permissions** (exceções opcionais por usuário)

| userId | effect | action | subject | fields | conditions |
| ------ | ------ | ------ | ------- | ------ | ---------- |
| u1     | deny   | update | user    | null   | null       |

→ Exemplo: Wendell está explicitamente negado para "update user" (ex.: para bloquear edição de certos usuários mesmo tendo a role TI). No uso real você costuma amarrar isso a condições.

Para criar isso no banco você pode usar um [Prisma seed](https://www.prisma.io/docs/guides/database/seed-database) ou rodar os INSERTs à mão; a pasta `roles/` não inclui script de seed por padrão.

# 4. Curiosidade: O padrão AWS IAM
Se você olhar as políticas do AWS IAM, verá que elas seguem exatamente essa lógica, apenas com nomes de chaves diferentes:

| AWS           | Este JSON   |
| ------------- | ----------- |
| Version       | version     |
| Statement     | statement  |
| Effect        | effect     |
| Action        | action     |
| Resource      | subject    |
| Condition     | conditions |

**Convenção:** Neste projeto usamos chaves em *lowercase* (`version`, `statement`, `effect`) no JSON; o IAM da AWS usa PascalCase na API. Os valores de `effect` são `"allow"` ou `"deny"` (lowercase).

Exemplo **AWS IAM** (PascalCase):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:GetObject", "s3:PutObject"],
      "Resource": "arn:aws:s3:::meu-bucket-exemplo/*"
    }
  ]
}
```

Exemplo **nosso ABAC** (lowercase, com subject/fields/conditions):

```json
{
  "version": "2012-10-17",
  "statement": [
    {
      "effect": "allow",
      "action": "update",
      "subject": "user",
      "fields": ["name", "email"],
      "conditions": { "country": "Brazil" }
    },
    {
      "effect": "deny",
      "action": "update",
      "subject": "user",
      "conditions": { "role": "admin" }
    }
  ]
}
```
