# AGENTS.md

Instructions for AI coding agents working on MetaMask Browser Extension.

---

## Agent Instructions Summary

**Project Type:** Browser extension (Chrome/Firefox)
**Languages:** TypeScript (required for new code), JavaScript (legacy)
**UI Framework:** React with functional components + hooks
**State Management:** Redux + BaseController architecture
**Testing:** Jest (unit), Playwright (E2E)
**Build System:** Browserify (production), Webpack (development)
**Security:** LavaMoat policies required for all dependency changes

### Critical Rules for Agents

1. **ALWAYS use TypeScript** for new files (never JavaScript)
2. **ALWAYS run `yarn lint:changed:fix`** before committing
3. **ALWAYS update LavaMoat policies** after dependency changes: `yarn lavamoat:auto`
4. **ALWAYS colocate tests** with source files (`.test.ts`/`.test.tsx`)
5. **ALWAYS use yarn.cmd** if you're running in PowerShell
6. **NEVER use class components** (use functional components with hooks)
7. **NEVER modify git config** or run destructive git operations
8. **NEVER commit** unless explicitly requested by user
9. **NEVER stage changes** unless explicitly requested by user

### Comprehensive Guidelines (Canonical Sources)

Read these files for detailed coding standards and examples—do not duplicate their content here.

| Topic                                                           | Canonical file                                                                          |
| --------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| Controller patterns                                             | `.cursor/rules/controller-guidelines/RULE.md`                                           |
| Unit testing                                                    | `.cursor/rules/unit-testing-guidelines/RULE.md`                                         |
| E2E testing                                                     | `.cursor/rules/e2e-testing-guidelines/RULE.md`                                          |
| Front-end performance (rendering, hooks, React Compiler, Redux) | `.cursor/rules/front-end-performance-rendering/RULE.md` and related in `.cursor/rules/` |
| PR workflow                                                     | `.cursor/rules/pull-request-guidelines/RULE.md`                                         |
| Code style & React                                              | `.cursor/rules/coding-guidelines/RULE.md`                                               |
| Official guidelines                                             | `.github/guidelines/CODING_GUIDELINES.md`                                               |

E2E deprecated patterns: `.cursor/BUGBOT.md`

---

## Quick Setup

- **Prerequisites:** Node.js+ (use `nvm use`), Yarn (Corepack), Infura API key (https://infura.io)
- **First-time:** `corepack enable` → `yarn install` → `cp .metamaskrc.dist .metamaskrc` → add `INFURA_PROJECT_ID` → `yarn start`
- **Load extension:** Chrome: see `docs/add-to-chrome.md`; Firefox: see `docs/add-to-firefox.md`
- **Optional:** `.metamaskrc` can set `PASSWORD`, `SEGMENT_WRITE_KEY`, `SENTRY_DSN`
- **Common issues:** `yarn` not found → `corepack enable`; policy errors → `yarn lavamoat:auto`; Infura error → check `INFURA_PROJECT_ID`; Ganache → port 8545; Git hooks → [Husky troubleshooting](https://typicode.github.io/husky/troubleshooting.html#command-not-found)

---

## Common Commands

- **Build:** `yarn start` (Chrome MV3), `yarn start:mv2` (Firefox), `yarn dist` (production). Test builds: `yarn build:test`, `yarn start:test`; or `yarn download-builds --build-type test`.
- **Tests:** `yarn test` / `yarn test:unit`; E2E: build test first then `yarn test:e2e:chrome` or `yarn test:e2e:single test/e2e/tests/… --browser=chrome --leave-running --debug`. Integration: `yarn test:integration`.
- **Lint:** `yarn lint`, `yarn lint:changed:fix`.
- **Dependencies:** After add/update/remove: `yarn lint:lockfile:dedupe:fix`, `yarn allow-scripts auto`, `yarn lavamoat:auto`, `yarn attributions:generate`.

Full command reference, setup details, common setup issues (yarn, LavaMoat, Infura, Ganache, Git hooks), and LavaMoat policy instructions: see `README.md` and `development/README.md`.

---

## Agent Workflows (Pointers)

- **New feature:** Create TypeScript files + colocated tests → `yarn lint:changed:fix` → `yarn test:unit path/to/test`; if E2E: `yarn build:test` then run E2E. Read `.cursor/rules/coding-guidelines/RULE.md` and relevant rules.
- **Modifying code:** Identify file type → read the matching rule (controller / unit test / E2E / coding) → change → lint and run tests → `yarn circular-deps:check` if needed.
- **Dependencies:** Add/upgrade → dedupe lockfile → allow-scripts → lavamoat → attributions → verify build. See “Common Commands” above.
- **Bug fix:** Add failing test → fix → confirm tests → lint. E2E: use test build and run E2E with debug/leave-running as needed.
- **Creating a controller:** Read `.cursor/rules/controller-guidelines/RULE.md` first. Create controller + test + types under `app/scripts/controllers/<name>/`; run tests and lint.

All patterns and code examples for controllers, unit tests, E2E, React performance, and code style live in the canonical rule files listed above—refer to them instead of copying into this file.

---

## Decisions & Project Layout

- **Which test build:** E2E iteration → `yarn start:test`; final verification → `yarn build:test`. Feature flags → `FEATURE_FLAG=1 yarn build:test`. Firefox → `yarn build:test:mv2`, `yarn test:e2e:firefox`.
- **Where to put code:** Controllers → `app/scripts/controllers/`; UI → `ui/components/` or `ui/pages/`; shared utils → `shared/lib/` or `app/scripts/lib/` or `ui/helpers/`; constants → `shared/constants/`; types → `shared/types/`, `types/`, or component `types.ts`; migrations → `yarn generate:migration` → `app/scripts/migrations/`.
- **Browser target:** Chrome/Edge/Brave → MV3 (`yarn start`, `yarn dist`). Firefox → MV2 (`yarn start:mv2`, `yarn dist:mv2`).

**Finding code:** Controllers → `app/scripts/controllers/`; React → `ui/components/`, `ui/pages/`; Redux → `ui/ducks/`, `ui/selectors/`; background → `app/scripts/`; constants → `shared/constants/`; utils → `shared/lib/`, `ui/helpers/`; types → `shared/types/`, `types/`; migrations → `app/scripts/migrations/`; build → `development/build/`, `development/webpack/`; manifests → `app/manifest/v2/`, `app/manifest/v3/`.

**File modification patterns:** Changing a controller → also update its test, types, and `app/scripts/metamask-controller.ts` if registering. Changing a component → test, types, stories, index. Changing ducks → test, selectors, consuming components. Changing deps → lockfile, allow-scripts, LavaMoat policies, attributions. Changing state shape → add migration under `app/scripts/migrations/`.

---

## Feature Flags, LavaMoat, Browser Compatibility

- **Feature flags:** Defined in `.metamaskrc` / `.metamaskrc.dist`; use env vars for one-off builds (e.g. `MULTICHAIN=1 yarn build:test`). Remote overrides: `.manifest-overrides.json` and `MANIFEST_OVERRIDES` in `.metamaskrc`.
- **LavaMoat:** Update policies when deps or Node API usage changes: `yarn lavamoat:auto`. Debug: `yarn lavamoat:debug:build` / `yarn lavamoat:debug:webapp`. Dev shortcut: `--apply-lavamoat=false` (do not merge without fixing).
- **Browsers:** MV2 = Firefox; MV3 = Chrome/Chromium. Use `browser.*` (polyfill); conditional logic in `app/scripts/lib/util.js` if needed.

---

## Testing, Migrations, PRs, and Code Style

- **Unit tests:** Colocated `.test.ts`/`.test.tsx`; Jest; test public API; use `describe` by method/function; present tense. See `.cursor/rules/unit-testing-guidelines/RULE.md`.
- **E2E:** Test build required; use page objects and fixtures; see `.cursor/rules/e2e-testing-guidelines/RULE.md` and `.cursor/BUGBOT.md`.
- **Migrations:** `yarn generate:migration`; never mutate input state; handle missing data. Canonical example: `app/scripts/migrations/template.ts`. QA/testing migrations: `docs/QA_MIGRATIONS_GUIDE.md`.
- **PRs:** Checklist (tests, lint, no debug code, LavaMoat/attributions if deps changed); follow [.github/pull-request-template.md](.github/pull-request-template.md) and [MetaMask Contributor Docs](https://github.com/MetaMask/contributor-docs). Details: `.cursor/rules/pull-request-guidelines/RULE.md`.
- **Code style & React:** TypeScript, functional components, destructured props, unique keys, memoization where appropriate. No class components. See `.cursor/rules/coding-guidelines/RULE.md` and `.cursor/rules/front-end-performance-rendering/RULE.md` (and related performance rules).

---

## Error Handling and Troubleshooting

- **Build errors:** LavaMoat → `yarn lavamoat:auto`; TypeScript → `yarn lint:tsc`; deps → `yarn install`. Last resort: clean `node_modules`, `dist`, `build` and reinstall + lavamoat.
- **Test failures:** If your change broke a test, fix code or update test if behavior changed intentionally. E2E: ensure test build is fresh, use `--debug` / `--leave-running`. Snapshot: `yarn test:unit -u` only if intentional.
- **LavaMoat:** Regenerate after dep changes; try clean install + `yarn lavamoat:auto`; platform-specific deps may need regeneration on that OS.
- **Circular deps:** `yarn circular-deps:check`; fix then `yarn circular-deps:update` and commit `development/circular-deps.jsonc`.

**Quick reference:**

| Problem          | Action                                               |
| ---------------- | ---------------------------------------------------- |
| Module not found | `yarn install`                                       |
| Out of memory    | `NODE_OPTIONS=--max-old-space-size=4096`             |
| LavaMoat errors  | `yarn lavamoat:auto`                                 |
| E2E won’t start  | `yarn build:test` first                              |
| Snapshot fails   | Review diff; `yarn test:unit -u` only if intentional |
| Port in use      | `lsof -ti:PORT \| xargs kill -9`                     |

---

## Pre-Completion Checklist

- `yarn lint:changed:fix` and `yarn lint:tsc`
- `yarn test:unit` for changed code; update tests if behavior changed
- `yarn circular-deps:check`
- If deps changed: lockfile dedupe, allow-scripts, LavaMoat, attributions
- No console.log/debug code; colocated tests; functional components; controllers follow BaseController patterns (see controller-guidelines)

---

## Additional Resources

- **Setup, commands, troubleshooting:** [README.md](./README.md) (setup, common issues, LavaMoat), [development/README.md](./development/README.md). [docs/testing.md](./docs/testing.md), [docs/](./docs/)
- **Canonical rules:** [.cursor/rules/controller-guidelines/RULE.md](./.cursor/rules/controller-guidelines/RULE.md), [.cursor/rules/unit-testing-guidelines/RULE.md](./.cursor/rules/unit-testing-guidelines/RULE.md), [.cursor/rules/e2e-testing-guidelines/RULE.md](./.cursor/rules/e2e-testing-guidelines/RULE.md), [.cursor/BUGBOT.md](./.cursor/BUGBOT.md), [.cursor/rules/front-end-performance-rendering/RULE.md](./.cursor/rules/front-end-performance-rendering/RULE.md) (and other front-end-performance rules), [.cursor/rules/pull-request-guidelines/RULE.md](./.cursor/rules/pull-request-guidelines/RULE.md), [.cursor/rules/coding-guidelines/RULE.md](./.cursor/rules/coding-guidelines/RULE.md), [.github/guidelines/CODING_GUIDELINES.md](./.github/guidelines/CODING_GUIDELINES.md)
- **External:** [MetaMask Contributor Docs](https://github.com/MetaMask/contributor-docs), [MetaMask Developer Docs](https://docs.metamask.io/), [Community Forum](https://community.metamask.io/), [Support](https://support.metamask.io/)
