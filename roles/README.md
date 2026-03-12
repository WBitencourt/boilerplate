# 1. RBAC (Role-Based Access Control)

Access is based on **role**: the system only sees "this user has role X" and "role X has permissions Y". There are no context or resource-attribute rules — just a fixed list of permissions (e.g. `"user:create"`, `"curso:admin"`). Simple, but not very flexible for rules like "can only edit their own record".

# 2. ABAC (Attribute-Based Access Control)

Access is based on **attributes**: the decision uses who the user is, what the resource is, and context (country, time, resource status, etc.). Instead of "Admin can do everything", you define rules like "can *update* *user* on fields *name, email* **if** *country = Brazil*". More expressive than RBAC and aligned with the AWS IAM policy model.

# 2.1. Anatomy of the JSON (Technical Terminology)
- **Effect:** "Allow" or "Deny". Defines whether the policy grants or denies access.
- **Action:** The "verb". Defines the operation (e.g. update, manage, read).
- **Subject (Resource):** The "noun". Defines which entity the action applies to.
- **Fields:** Also called fine-grained access. Defines permission granularity at the column/property level.
- **Conditions:** Defines scope. Where business logic lives (e.g. "only if status is open").

# 3. Database

Schema: `roles/abac.prisma`.

## 3.1. How the relationships work

- **users** and **roles** are linked by **user_roles** (pivot). One user can have many roles; one role can belong to many users. So: *Wendell* can be RH and TI; *João* can be Suporte; the role *TI* can be assigned to Wendell and to others.
- Each **role** has its own ABAC policies in **role_permissions** (one row = one statement: effect, action, subject, fields, conditions). Those are the default permissions for everyone with that role.
- **user_permissions** are per-user overrides or extras. If you need “Wendell can also do X” or “João is denied Y”, you add a row here. When resolving access, you merge role_permissions (from all the user’s roles) with user_permissions; deny usually wins over allow.

So: **User ↔ Role** (many-to-many via **user_roles**), **Role → RolePermission** (one-to-many), **User → UserPermission** (one-to-many).

## 3.2. Example data (fictitious)

Roles: **RH**, **Suporte**, **TI**. Users: **Wendell Bitencourt**, **João Frango**.

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

**user_roles** (who has which role)

| userId | roleId |
| ------ | ------ |
| u1     | r1     |
| u1     | r3     |
| u2     | r2     |

→ Wendell has roles RH and TI. João has role Suporte.

**role_permissions** (ABAC policies per role)

| roleId | effect | action | subject | fields        | conditions  |
| ------ | ------ | ------ | ------- | ------------- | ----------- |
| r1     | allow  | read   | user    | null          | null        |
| r1     | allow  | update | user    | ["name","email"] | {"department":"RH"} |
| r2     | allow  | read   | chamado | null          | null        |
| r2     | allow  | update | chamado | ["status"]    | null        |
| r3     | allow  | read   | user    | null          | null        |
| r3     | allow  | manage | chamado | null          | null        |

→ RH can read user and update name/email when department is RH. Suporte can read chamado and update status. TI can read user and manage chamado.

**user_permissions** (optional overrides per user)

| userId | effect | action | subject | fields | conditions |
| ------ | ------ | ------ | ------- | ------ | ---------- |
| u1     | deny   | update | user    | null   | null       |

→ Example: Wendell is explicitly denied “update user” (e.g. to block editing certain users despite having role TI). In real use you’d often tie this to conditions.

To create this in the DB you can use a [Prisma seed](https://www.prisma.io/docs/guides/database/seed-database) or run the inserts by hand; the `roles/` folder does not include a seed script by default.

# 4. Note: The AWS IAM pattern
If you look at AWS IAM policies, they follow this same logic, with different key names:

| AWS           | This JSON   |
| ------------- | ----------- |
| Version       | version     |
| Statement     | statement  |
| Effect        | effect     |
| Action        | action     |
| Resource      | subject    |
| Condition     | conditions |

**Convention:** In this project we use *lowercase* keys (`version`, `statement`, `effect`) in the JSON; AWS IAM uses PascalCase in its API. The `effect` values are `"allow"` or `"deny"` (lowercase).

**AWS IAM** example (PascalCase):

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

**Our ABAC** example (lowercase, with subject/fields/conditions):

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
