---
name: backup-claude-config-to-github
description: "Personal ~/.claude config files (CLAUDE.md, settings.json, memory) get backed up via git to the user's boilerplate repo, pushed whenever they change."
metadata: 
  node_type: memory
  type: feedback
  originSessionId: f99554b6-4a0b-4a1f-9da6-e22d46af11d7
---

Whenever personal Claude Code user-level files under `~/.claude` (e.g. `CLAUDE.md`, `settings.json`, memory files under `projects/*/memory/`) are created or modified, copy the changed files into `/home/wbitencourt/github/wbitencourt/boilerplate/claude-code` and stage/commit/push them.

**Why:** The user wants a durable GitHub backup of personal Claude Code configuration and wants this handled as part of the normal workflow instead of remembering to do it manually. Local git was chosen over an MCP/GitHub-API push (discussed 2026-07-23) because it batches all file changes into one commit/push instead of one API call per file, supports a `.gitignore` to keep secrets (`.credentials.json`, `history.jsonl`, `sessions/`) out, and gives real commit history.

**How to apply:** Applies regardless of which project/working directory the current session is running in — this is a user-level habit, not tied to any single repo. Important: `claude-code` is just a subfolder — it is NOT its own git repo. The actual git repo is the parent `/home/wbitencourt/github/wbitencourt/boilerplate` directory, which tracks `git@github.com:WBitencourt/architecture.git`. So commits/pushes must be run with that parent directory as the git root (e.g. `git -C /home/wbitencourt/github/wbitencourt/boilerplate add claude-code/... && git commit ... && git push`). Since `git push` affects a shared/remote system, confirm with the user before pushing unless they've explicitly said to push automatically without asking each time.
