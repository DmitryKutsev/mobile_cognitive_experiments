# AGENTS.md

## Current state

- The app is a TypeScript + React Native Expo development-build scaffold; audio is explicitly simulated. Read `README.md` for the agreed protocol, exact setup/run/check commands, and verification limits.
- Shared Session/timing/report rules live in `src/domain/experiment.ts`; experiment definitions and the word configuration live separately. Run `npm run check` after protocol changes and `npm run export` after app/bundling changes.
- Native `ios/` and `android/` projects are generated and ignored. Express native configuration through `app.json` or Expo config plugins so regeneration preserves it.
- Session usernames, results, and settings stay in memory. Real audio is deferred to GitHub #2; accounts and saved results to #3.
- Matt Pocock's skills are project-local in `.agents/skills/`; see `README.md` for restore, verification, and update commands.
- When tooling is introduced, document exact setup and verification commands in `README.md` and update this file with any non-obvious workflows.

## Agent skills

### Issue tracker

Issues and specs are tracked in GitHub Issues at `DmitryKutsev/mobile_cognitive_experiments`. See `docs/agents/issue-tracker.md`.

After every PR merge, verify that GitHub reports the PR as merged, then close the GitHub issue(s) resolved by that PR. Use closing references in the PR body and verify closure after merging; if an issue remains open, comment with the merged PR link and close it explicitly. Keep deferred follow-up issues open until their work is completed.

### Triage labels

Use the five canonical labels without customization. See `docs/agents/triage-labels.md`.

### Domain docs

Use the single-context layout: `GLOSSARY.md` and `docs/adr/` at the repo root. See `docs/agents/domain.md`.
