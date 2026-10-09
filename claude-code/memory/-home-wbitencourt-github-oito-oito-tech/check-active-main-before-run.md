---
name: check-active-main-before-run
description: "crud-dynamodb index.ts has many mains (one active) that hit PROD DynamoDB; always re-read which main is active right before `npm run dev`"
metadata:
  node_type: memory
  type: feedback
  originSessionId: 1e0c1160-3bd7-4eaa-94e8-ad5c26caca0a
  modified: 2026-10-09T12:38:15.069Z
---

In `crud-dynamodb/src/app/index.ts` the user keeps many `main()` blocks, only one uncommented, and they edit it between turns. `npm run dev` runs it against PROD tables (TblProd*). Before every run, grep for the uncommented `async function main` / `main()` and confirm it is the one intended — never rely on what was active earlier in the conversation.

**Why:** On 2026-10-09 a re-run meant for a read-only report executed the user's newer `updateDemandaLista` main instead, moving 94 PicPayCadastro demandas to PosAuditoriaOito in prod.

**How to apply:** Immediately before `npm run dev`, check the active main; if it isn't yours, stop and ask before swapping. Prefer running one-off scripts via a separate entry file (e.g. `npx tsx ./_script.ts`) instead of editing/running index.ts.
