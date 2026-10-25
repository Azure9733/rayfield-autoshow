# CLAUDE.md

Rayfield Autoshow — Incubyte TDD kata (car dealership inventory). PLAN.md holds the plan and the backend test list; UI_PLAN.md covers the frontend and its test list (§10).

## TDD workflow
- Strict TDD: one behaviour per cycle, in PLAN.md order (frontend: UI_PLAN.md §10). A table of cases for one rule (`it.each`) counts as one cycle.
- **Red:** write ONE failing test, run it, show that it fails, propose the `test:` commit message, and stop.
- **Green:** after I confirm, commit the test, write the minimum code to pass, run the tests, and propose the `feat:` commit. That commit ticks the item's checkbox in PLAN.md (UI_PLAN.md for frontend tests).
- **Refactor:** suggest one, or say none is needed.
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
- Show me the message and ask before committing.

## Safety
- Never read, print or commit real `.env` files (only `.env.example`, plus `.env.test`, which holds dummy values) or `Assignment.pdf`. Every session is published unedited in PROMPTS.md.
- Tests use the Docker test database, never Supabase.

## Style
- Comments explain why, not what; short JSDoc on exported functions.
- UI work follows UI_PLAN.md.
- Keep replies short.
