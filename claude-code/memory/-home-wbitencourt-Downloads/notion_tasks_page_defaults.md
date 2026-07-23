---
name: notion-tasks-page-defaults
description: "Default field values when creating new pages in the Notion \"Tasks\" database"
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 95ae7da3-b210-40f5-83a5-42b17b873cfd
---

When creating a new page in the Notion **Tasks** database (data source id `3418ef24-0b6a-800a-b2aa-f8e0c164f582`), apply these defaults without being asked:

- **Status**: leave as `Not started` (this is already the Notion default).
- **Priority Level**: ask the user which priority to use before creating the page, suggesting `Baixa` as the default if they don't specify.
- **Start**: set to the date the page is created (today's date).

**Why:** user explicitly requested this workflow on 2026-06-30 to streamline creating quick Tasks entries (e.g. "hello world" test pages) without repeating instructions every time.

**How to apply:** any time a new page is created in this Tasks database going forward, prompt for priority and fill Start with the creation date automatically. Don't apply these defaults to other Notion databases unless asked.
