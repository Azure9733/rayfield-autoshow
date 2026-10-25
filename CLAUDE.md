# CLAUDE.md

Rayfield Autoshow — Incubyte TDD kata (car dealership inventory). [docs/PLAN.md](docs/PLAN.md) holds the plan and the backend test list; [docs/UI_PLAN.md](docs/UI_PLAN.md) covers the frontend and its test list (§10). Below, PLAN.md and UI_PLAN.md mean those files.

## TDD workflow
- Strict TDD: one behaviour per cycle, in PLAN.md order (frontend: UI_PLAN.md §10). A table of cases for one rule (`it.each`) counts as one cycle.
- **Batch mode:** work through the current PLAN.md subsection without waiting for me. For each item:
  1. Write the test, run it and note why it fails, commit red (`test:`).
  2. Write the minimum code, run the whole suite, commit green (`feat:`); this commit ticks the item's checkbox in PLAN.md (UI_PLAN.md for frontend tests).
  3. Refactor only if clearly needed (`refactor:`, suite green).
  4. Push.
- After the subsection, stop and give a short summary: each test name, why it failed at red, and anything I should look at. Stop early if something needs my decision.
- **Guard test:** a test that passes on its first run. Briefly break the code to prove it can fail, restore it, then commit it as `test: guard <behaviour>` saying why it passes; that commit ticks its checkbox.
- Sometimes I write the failing test myself: review it, run it, then go green.

## Commits
- Prefixes: `test:`, `feat:`, `refactor:`, `chore:`, `docs:`.
- The body says what AI did vs what I did (only what's true), then two blank lines and exactly `Co-authored-by: Claude <noreply@anthropic.com>`:

```
feat: return 409 when purchasing an out-of-stock vehicle

AI: wrote the conditional UPDATE and the OutOfStockError mapping.
Me: reviewed the SQL, added the concurrency test case.


Co-authored-by: Claude <noreply@anthropic.com>
```

- Write the message to a temp file outside the repo and commit with `git commit --cleanup=verbatim -F <file>` so both blank lines survive. Every commit, including `--amend`, uses `--cleanup=verbatim`.
- Commit without asking in batch mode. Keep every `Me:` line true: if I haven't reviewed a commit, don't say I did.
- Push after each finished item (once its last commit lands); never push a lone red commit.

## Safety
- Never read, print or commit real `.env` files (only `.env.example`, plus `.env.test`, which holds dummy values) or `Assignment.pdf`. Every session is published unedited in PROMPTS.md.
- Tests use the Docker test database, never Supabase.

## Style
- Comments explain why, not what; short JSDoc on exported functions.
- UI work follows UI_PLAN.md.
- Keep replies short.
