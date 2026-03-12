# 1. ABAC (Attribute-Based Access Control)

Diferente do RBAC (onde você apenas diz "Admin pode tudo"), no ABAC você usa atributos do sujeito (quem), 
do objeto (o quê) e do ambiente (contexto) para decidir o acesso.

"permissions": ["user:create", "user:update", "curso:admin"]

# 2. Anatomia do JSON (Terminologia Técnica)

- **Action (Ação):** O "verbo". Define a operação (ex: update, manage, read).
- **Subject (Assunto/Recurso):** O "substantivo". Define em qual entidade a ação atua.
- **Fields (Camadas/Atributos):** Também chamado de Fine-grained access (acesso fino). Define a granularidade da permissão em nível de coluna/propriedade.
- **Conditions (Condições/Predicados):** Define o Escopo. É onde a lógica de negócio entra (ex: "só se o status for aberto").

# Curiosidade: O padrão AWS IAM
Se você olhar as políticas do AWS IAM, verá que elas seguem exatamente essa lógica, apenas com nomes de chaves diferentes:

Action -> Igual ao seu.
q   
Resource -> O seu subject.

Condition -> O seu conditions.
