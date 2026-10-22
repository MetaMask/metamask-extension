# Remove Dead Code (Cursor Automation)

Scheduled automation prompt for MetaMask Extension. It is the extension counterpart
of the MetaMask Mobile automation in
[MetaMask/metamask-mobile#37948](https://github.com/MetaMask/metamask-mobile/pull/37948).
Each run finds a small batch of **completely dead** code, deletes it, verifies
nothing broke, and opens **one small PR** whose files all share a single
CODEOWNERS owner set, so it needs only one team's review. Dead code means
anything nothing in the repo can ever read or run:

- whole files
- unused exported functions, utils, constants, components, hooks, selectors,
  and types
- unused local variables, imports, and private helpers
- unused CSS class selectors in our stylesheets

It works through owner sets one at a time. It starts with code that has **no
CODEOWNERS entry**, because any maintainer can approve those PRs. Progress,
open PRs, and rejected candidates live in the automation's Memories, so runs
build on each other instead of repeating work.

Extension does not use React Native `StyleSheet`s. Styles are global SCSS/CSS
class names (css-loader does not turn them into CSS modules). Unused class
selectors are kind D below. Tailwind utility class names in JSX are not dead
CSS and are out of scope.

## Suggested setup

- Trigger: weekdays at 09:00 America/Vancouver (cron `0 9 * * 1-5` in that
  timezone). If the scheduler is UTC-only, that is `0 16 * * 1-5` during PDT
  and `0 17 * * 1-5` during PST. One PR per run at most.
- Repo / branch: `MetaMask/metamask-extension` / `main`
- Model: a high-reasoning model. Deleting code depends on judgment, and most of
  each run is spent on `yarn install`, `tsc`, and `jest` anyway.
- Tools: **Open Pull Request** and **Memories**. No Slack or MCP needed.
- Run as: PRs opened under "Run as: Me" are authored by you, so someone else
  has to approve them. Under "Run as: Service account", PRs come from the
  `cursor` bot and you can approve them yourself. For unowned code that is
  often the only approval needed.

## Manual steps per PR

- Confirm a `team-*` label is present. `check-template-and-add-labels` adds one
  on open for an internal author, using the MetaMask-planning team map. The
  automation also applies `team-design-system` when no `team-*` label landed
  (a service account often does not map to a team). Labeling guidelines require
  a `team-*` label for internal authors.
- Mark the PR ready for review once CI is green. The automation opens drafts.
- If a PR is closed or a reviewer says "keep this", leave the reason as a PR
  comment. The next run records it in Memories so the file is not proposed
  again. You can also edit `MEMORIES.md` directly in the tool configuration UI.

## Prompt (copy into Cursor Automation)

````text
You are the MetaMask Extension dead-code removal automation. Each run, open at
most ONE small, easy-to-merge PR that deletes code which is provably
unreachable. Easy review and merge matter more than how much gets deleted.

## 0. Environment

- `source ~/.nvm/nvm.sh && nvm install && nvm use && corepack enable`
  (`.nvmrc` pins Node >=24.13; the repo needs Yarn 4 via corepack, enabled
  under Node 24, not the legacy Yarn 1 that ships with Node 22).
- Cursor cloud images put `/exec-daemon/node` (Node 22) ahead of nvm on `PATH`.
  After `nvm use`, run `node -v`. If it is still 22, prepend the nvm Node 24
  bin (`dirname "$(nvm which current)"`) to `PATH` and enable corepack again.
- `export COREPACK_ENABLE_DOWNLOAD_PROMPT=0`. Without it, the first `yarn`
  call can hang forever on an invisible "download Yarn?" prompt.
- `yarn install --immutable`. Only use yarn, never npm/npx. If `node_modules`
  already exists from the environment snapshot, still run it; it is fast.
- `git fetch origin main`, then branch from `origin/main`.
- `gh` may be unable to read MetaMask repos (org SAML). Do not depend on it.
  Use git, Memories, and the Open Pull Request tool. The public GitHub API
  works without auth.
- Do not webpack-build the extension. Verification is typecheck, lint, unit
  tests, and stylelint. `.metamaskrc` is not required for those.

## 1. Load and reconcile state (Memories)

Read `MEMORIES.md`. If it does not exist, create it with this structure:

```
# Dead code automation ledger
## Owner queue
current: (none)
next: (decide in step 3)
exhausted: []
## Open PRs
<!-- - YYYY-MM-DD | <branch> | <owner set> | <kind> | <PR title> | files: a, b | symbols: x, y -->
## Done
<!-- - YYYY-MM-DD | <owner set> | <kind> | merged|closed | <branch> -->
## Do not touch
<!-- - <path>[#symbol] | reason (false positive, reviewer said keep, closed PR, ...) -->
## Notes
<!-- next batches queued, detector false-positive patterns learned -->
```

For every entry under "Open PRs", get the real PR state. The public GitHub API
works without auth (60 requests/hour), so keep calls to a handful per run:
`curl -s "https://api.github.com/repos/MetaMask/metamask-extension/pulls?head=MetaMask:<branch>&state=all"`
gives `number`, `state`, and `merged_at`.
- `merged_at` set: merged. Move it to "Done".
- `state` is `closed` and `merged_at` is null: closed unmerged. Move it to
  "Done" as closed. Read why with
  `curl -s .../issues/<number>/comments` and `.../pulls/<number>/comments`.
  - If a human said the code is still needed, add those files/symbols to "Do
    not touch" with their reason.
  - If there is no clear reason (stale, superseded, closed by mistake), don't
    blacklist anything. Note it in Notes and let those candidates come back
    after 30 days.
- `state` is `open`: still open. Read its comments the same way. Record any
  "keep this" feedback under "Do not touch", and note any requested changes in
  Notes for a human. Never push to an existing PR's branch.
- If the API is unavailable, fall back to git:
  - It merged if `git log origin/main --fixed-strings --grep="<PR title>"`
    finds a commit, or if every file and symbol the entry lists as removed is
    gone from `origin/main`.
  - Otherwise, if `git ls-remote --heads origin <branch>` is empty, mark it
    "closed or merged (unverified)". Don't blacklist anything, and don't count
    it toward the WIP limit.
  - Otherwise treat it as open.

WIP limit: if 3 or more PRs are still open, STOP. Update Memories, open
nothing, and reply with a one-line status. Reviewers must not be flooded.

## 2. What counts as "completely dead"

Dead means nothing in the repo can ever read or execute it, in any build type
(main, beta, experimental, flask) and either manifest (MV2 Firefox or MV3
Chrome). Behind a flag or not, if something can still reach it, it is live.
Every kind below is in scope:

A. Whole files under `app/`, `ui/`, or `shared/` with zero inbound references,
   including files referenced only by their own co-located `*.test.*`,
   `*.stories.*`, or `__mocks__` files (delete those too), barrel `index.*`
   files nobody imports, and whole `*.scss` / `*.css` files whose every class
   selector is unused (kind D) and that export no mixin or function another
   stylesheet still includes.
B. Unused exports: exported functions, utils, constants, components, hooks,
   selectors, action creators, enums, and types/interfaces that no other file
   imports and the defining file does not use itself. Delete the declaration.
   If the file still uses it, leave it alone; don't just drop `export`.
C. Unused locals inside a live file: unused imports, variables, constants,
   private (non-exported) functions, and local types.
D. Unused CSS class selectors. Stylesheets are global: a class in
   `ui/**/*.scss`, `ui/**/*.css`, `app/**/*.scss`, or `app/**/*.css` is dead
   when no component, HTML file, test, snapshot, story, or e2e selector
   applies it, and no other stylesheet `@extend`s it. Delete that ruleset.
   This is the extension equivalent of Mobile's unused `StyleSheet` keys.
E. Cascade: anything that becomes dead only because of this batch (a helper
   only the deleted code called, a stylesheet only the deleted component
   used, a barrel `@import` of a deleted stylesheet, an export only a dead
   file imported).

Out of scope. Never delete:

- Anything referenced by a string, glob, or path outside import statements:
  `package.json` scripts, `builds.yml`, `jest.config.js`, `jest.*.config.js`,
  `babel.config.js`, `tsconfig*.json`, `.storybook/`, `.github/`,
  `development/`, `sonar-project.properties`, `stylelint.config.js`,
  `tailwind.config.js`, `oxfmt.config.mts`, `app/manifest/`,
  `development/circular-deps.jsonc`, `privacy-snapshot.json`,
  `legacy-background-api-snapshot.json`.
- Code inside or only used from code fences (`///: BEGIN:ONLY_INCLUDE_IF`,
  `///: BEGIN:EXCLUDE_IF`). It is live in another build type. Bitcoin and Tron
  fences in `shared/constants/multichain/networks.ts` are the known case.
- Code behind feature flags, remote feature flags, or `builds.yml` features.
  That is "unreleased", not dead. Removing it is a product decision.
- Webpack and manifest entry points, even if nothing imports them. They are
  loaded by HTML or `app/manifest/`: `app/service-worker.ts`,
  `app/scripts/load/bootstrap.ts`, `app/scripts/load/background.ts`,
  `app/scripts/load/ui.ts`, `app/scripts/contentscript.js`,
  `app/scripts/inpage.js`, `app/scripts/use-snow.js`,
  `app/offscreen/offscreen.ts`, `app/scripts/cashtag/widget/frame.tsx`,
  `app/scripts/cashtag/contentscript.ts`, `app/vendor/trezor/content-script.js`,
  `app/vendor/trezor/usb-permissions.js`.
- Separately bundled pages: `app/scripts/cashtag/` (the X cashtag pill and
  widget inject their own CSS), and anything under `app/vendor/`.
- Function parameters, React props in a component's props type, class
  members, and object fields in types that other code builds or reads. Those
  are API surface, not dead code.
- `DEV_*`/debug toggles and intentionally `_`-prefixed variables.
- `app/scripts/migrations/`, `*.d.ts`, `__mocks__/`, `app/_locales/` (Crowdin;
  do not drop message keys even when the last `t()` call goes away),
  images/fonts, `package.json` dependencies, `lavamoat/`, `test/e2e/`,
  `test/integration/`, `test/mocks/`, `test/fakes/`, and `development/`.
- `ui/components/component-library/`, until the owner queue reaches
  `@MetaMask/design-system-engineers`. Its classes are the design-system API
  and its stories are documentation.
- Deep-link security files. Deleting or narrowing these can skip the security
  interstitial. Never touch them, in any owner turn:
  `AGENTS.md`, `app/scripts/lib/deep-links/`, `shared/lib/deep-links/parse*`,
  `shared/lib/deep-links/security-policy*`, `shared/lib/deep-links/utils*`,
  `shared/lib/deep-links/verify*`, `shared/lib/deep-links/routes/route*`,
  `ui/helpers/utils/resolve-deep-link-href*`, `ui/pages/deep-link/`.
- `ui/css/tailwind.css` and Tailwind utility class names in JSX (`flex`,
  `mt-4`, arbitrary values). They are not local class selectors. Also do not
  remove a `className` string just because no local stylesheet defines it.
- Element selectors, attribute selectors, and `%placeholder` selectors.
  Placeholders are not class names. A class that exists only as an
  `@extend .class` target is used.
- Stylesheet files whose selectors contain Sass interpolation (`#{`). The
  nest cannot be resolved safely. Skip the whole file and note it.
- Anything listed under "Do not touch".
- Public API consumed outside this repo: the inpage provider (`window.ethereum`
  / multichain provider methods), Snaps RPC and the snaps execution iframe,
  JSON-RPC method names, analytics event names, `testID` / `data-testid`
  constants read by `test/e2e/` page objects, route constants, or anything
  `docs/` describes as a supported API.

## 3. Pick the owner set for this run

Resolve owners the way GitHub does: the LAST matching pattern in
`.github/CODEOWNERS` wins. A pattern that names a directory matches that
directory and everything under it. Patterns without a slash match at any
depth. `dir/*` matches only direct children. `**/*.snap` and `**/*.stories.*`
are the last patterns and have no owners, so snapshots and stories never add
an owner and may ride along with any owner set.

A PR qualifies only if every touched file except `*.snap` and `*.stories.*`
resolves to the SAME owner set. "No owner" is an owner set of its own. Skip
any candidate whose cleanup would touch a file with a different owner set
(a story or snapshot is fine; an edit to `ui/css/index.scss`, which is owned
by `@MetaMask/core-extension-ux`, is not, unless that is the current set).
Leave it for that owner's turn.

Stylesheet barrels and their owners, for kind D cascades:

- `ui/components/app/app-components.scss` (unowned unless a later rule matches)
- `ui/components/ui/ui-components.scss`
- `ui/components/multichain/multichain-components.scss`
- `ui/components/multichain-accounts/multichain-accounts.scss`
- `ui/pages/pages.scss`
- `ui/components/component-library/component-library-components.scss`
  (design-system; defer with that directory)
- `ui/css/index.scss` (`@MetaMask/core-extension-ux`)

Queue order:

1. `(none)`: files with no CODEOWNERS match. Start here.
2. Then single-team owner sets, in order of how many candidates they have.
   There is no prior extension sweep to skip. Do not copy Mobile's skip of
   earn, confirmations, and core-platform.
3. Never target multi-team owner sets (a line with two `@MetaMask/` teams, or
   a team plus a person).

Stay on `current` until a run finds nothing left that passes step 4. Then add
it to `exhausted`, advance to the next owner set, and continue in the same run.
`ui/components/component-library/` stays deferred until its owner is current,
even if knip lists files there during the `(none)` turn.

## 4. Find candidates

Run the detectors, then filter their output to the current owner set. Never
commit detector configs or scripts; keep them in `/tmp`.

Kinds A, B (and A/B cascades): knip. Write `/tmp/knip.json`:

```json
{
  "entry": [
    "app/service-worker.ts",
    "app/scripts/load/bootstrap.ts",
    "app/scripts/load/background.ts",
    "app/scripts/load/ui.ts",
    "app/scripts/contentscript.js",
    "app/scripts/inpage.js",
    "app/scripts/use-snow.js",
    "app/offscreen/offscreen.ts",
    "app/scripts/cashtag/widget/frame.tsx",
    "app/scripts/cashtag/contentscript.ts",
    "app/vendor/trezor/content-script.js",
    "app/vendor/trezor/usb-permissions.js",
    "app/**/*.{test,spec}.{js,jsx,ts,tsx}",
    "ui/**/*.{test,spec}.{js,jsx,ts,tsx}",
    "shared/**/*.{test,spec}.{js,jsx,ts,tsx}",
    "app/**/*.stories.{js,jsx,ts,tsx}",
    "ui/**/*.stories.{js,jsx,ts,tsx}",
    "shared/**/*.stories.{js,jsx,ts,tsx}",
    "app/**/__mocks__/**",
    "ui/**/__mocks__/**",
    "shared/**/__mocks__/**",
    "test/**/*.{js,jsx,ts,tsx}",
    ".storybook/**/*.{js,ts,tsx}",
    "jest.config.js",
    "jest.*.config.js",
    "babel.config.js"
  ],
  "project": [
    "app/**/*.{js,jsx,ts,tsx}",
    "ui/**/*.{js,jsx,ts,tsx}",
    "shared/**/*.{js,jsx,ts,tsx}"
  ],
  "ignore": [
    "app/scripts/migrations/**",
    "app/_locales/**",
    "**/*.d.ts",
    "test/fakes/**",
    "app/vendor/**"
  ],
  "ignoreDependencies": [".*"],
  "ignoreExportsUsedInFile": true,
  "babel": false, "eslint": false, "execa": false,
  "github-actions": false, "husky": false, "jest": false,
  "lint-staged": false, "metro": false, "node": false, "nyc": false,
  "playwright": false, "prettier": false, "react": false,
  "storybook": false, "tailwind": false, "tsx": false,
  "typescript": false, "webpack": false, "yarn": false
}
```

All plugins stay disabled because the auto-enabled ones (jest coverage globs,
among others) mark every file as used. `package.json` `imports` map `#ui/*`
and `#shared/*`. Knip should resolve those. After the first run, confirm a
file imported only through `#shared/...` is not reported unused. If it is,
add a `paths` map for `#ui/*` -> `ui/*` and `#shared/*` -> `shared/*` and
rerun. Do not delete anything from a run that mis-resolves those imports.
Ignore reports under `test/fakes/` (a Yarn workspace, not extension UI).

Run knip twice with
`NODE_OPTIONS=--max-old-space-size=8192 yarn dlx -q -p knip@5 -p typescript@5.9.3 -p @types/node@24 knip --directory "$PWD" --reporter json --no-progress <flags>`.
If the process is killed, retry once with `--max-old-space-size=12288`.

1. `--config /tmp/knip.json --include files,exports,types > /tmp/knip.out.json`
   Tests, stories, and mocks count as roots here, so this run finds files and
   exports that nothing references at all. Use it for kind B and for
   zero-reference files.
2. Copy the config to `/tmp/knip-prod.json`, append `!` to the production
   roots (every manifest/HTML entry, `jest.config.js!`, `jest.*.config.js!`,
   `babel.config.js!`) and to each project glob, and leave test/story/mock
   entries unmarked. Then run
   `--config /tmp/knip-prod.json --production --include files > /tmp/knip-prod.out.json`.
   This lists every file production code cannot reach, including files only
   their own tests or stories use. Subtract the run 1 files to get the
   test-only set. Its output also includes test helpers and mocks. The step 2
   exclusions still apply.

knip reports an export as unused when its only importers are themselves dead
files. Treat those as cascades: delete them in the same batch as the dead
importer, or skip them. Knip does not see SCSS `@import`s. Unused stylesheets
come from kind D, not from knip.

Kind C, TypeScript:
`NODE_OPTIONS=--max-old-space-size=8192 yarn tsc --pretty false --noUnusedLocals > /tmp/tsc-unused.log`
(`tsconfig.json` already sets `noEmit`; `yarn lint:tsc` does not pass
`--noUnusedLocals`). Retry at heap 12288 if it is killed. Use diagnostics
TS6133, TS6192, TS6196, and TS6198. Other errors are pre-existing; do not
fix them. JS is not type-checked (`checkJs` is off). Filter to `app/`, `ui/`,
and `shared/`, including colocated `*.test.ts` / `*.test.tsx`. Skip
`development/`, `test/e2e/`, and migrations.

Kind C, JavaScript: `@typescript-eslint/no-unused-vars` is off in
`.eslintrc.js`, so CI will not flag these. For the current owner set's
directories only, run:

`NODE_OPTIONS='--max-old-space-size=8192' yarn eslint <dirs> -c ./.eslintrc.js --ext js,jsx --rule '@typescript-eslint/no-unused-vars: [error, { vars: all, args: none, ignoreRestSiblings: true, varsIgnorePattern: "^_", caughtErrors: none }]' --quiet --no-error-on-unmatched-pattern`

Do not lint the whole repo with that override. Args are `none` so unused
parameters stay (they are out of scope).

Kind D: unused CSS class selectors. Write a script in `/tmp`. css-loader is
not using CSS modules, so class names are global strings.

1. Parse each stylesheet under `ui/` and `app/` (skip `ui/css/tailwind.css`
   and `development/`). Strip comments. Walk rulesets with a brace stack and
   resolve `&` against the parent selector so `&__header` inside `.send`
   becomes `send__header`. Split selector lists on commas. Record each class
   token (`.<name>`).
2. If any selector in the file contains `#{`, skip the whole file.
3. A class is referenced when any of these is true. Search `app/`, `ui/`,
   `shared/`, `test/`, `.storybook/`, and `app/**/*.html`, including
   `*.snap`. Do not search `node_modules` except for the `mm-` check below.
   - The exact class is a whole token in a non-style file (`className`,
     `classnames(...)`, `classNames`, `getByClass`, a snapshot, an e2e CSS
     selector, an HTML `class`).
   - Some token is this class plus `__` or `--` (`home__container` keeps the
     nesting parent `home`). Do not delete a parent ruleset that still
     contains a used nested class.
   - Another stylesheet has `@extend .<class>`.
   - A `classNames="prefix"` or `classNames={'prefix'}` prop (react-transition-group)
     generates the class: `prefix-enter`, `prefix-enter-active`,
     `prefix-enter-done`, `prefix-exit`, `prefix-exit-active`,
     `prefix-exit-done`, `prefix-appear`, `prefix-appear-active`,
     `prefix-appear-done`. Known prefixes include `card` and `next-card` in
     `ui/components/multichain/carousel/carousel.tsx`.
   - The class is built dynamically. A static template prefix counts only
     when it contains `__` or `--`, or it is the full BEM block of a class
     in this file (`hold-to-reveal-button__${` counts; short prefixes like
     `item-` or `file` do not). Skip those classes.
4. Classes that start with `mm-` and are not rendered anywhere in this repo
   may still be emitted by a `@metamask/*` dependency this selector
   customizes. Search that class under `node_modules/@metamask`. If a
   dependency renders it, skip it. `ui/components/app/snaps/snap-install-warning/index.scss`
   overriding `.mm-checkbox__input` is the shape of this false positive.
5. Never delete element selectors, attribute selectors, or `%placeholder`s.
   Cashtag CSS is mostly attribute selectors; leave those rules alone.

For EACH candidate, prove it before deleting:

- Run a whole-word search across the whole repo:
  `rg -n -w --hidden -g '!node_modules' -g '!.git' '<name>'`.
  - Kind A: use the file name with every extension removed
    (`Modal.tsx` -> `Modal`, `foo.scss` -> `foo` and the component name),
    because imports omit extensions. For `index.*` files, search the parent
    directory name instead (`Foo/index.ts` -> `Foo`). Also search the
    repo-relative path without its extension
    (`ui/components/app/tab-bar/index` and `components/app/tab-bar`) to catch
    string and config references. SCSS barrels `@import` paths without the
    extension (`@import 'tab-bar/index'`).
  - Kinds B/C/D: use the symbol or the compiled class name.
  - Every hit must be one of: the definition, code deleted in this same
    batch, a comment or CHANGELOG mention, or a provably unrelated
    identifier with the same name. A comment-only hit is not a use.
- Check for string or dynamic references: `jest.spyOn(module, '<name>')`,
  `jest.mock` factories that return the name, `import * as X` followed by
  `X.<name>` or `X[...]`, `require(` / `import(` with template strings,
  `React.lazy`, `safeComponentList` in
  `ui/components/app/metamask-template-renderer/safe-component-list.js`,
  redux action type strings, route tables, and manifest script paths.
- Check its age. New code with no callers yet is usually waiting for a
  follow-up PR, not dead.
  - Kind A. When the file was added:
    `git log -1 --diff-filter=A --follow --format='%h %ad' --date=short -- <file>`.
    `-1` is the newest add, which is the current file if it was deleted and
    re-added.
  - Kinds B/C/D. Blame the declaration lines, not the oldest mention of the
    string:
    `git blame -L <start>,<end> --date=short -w -- <file>`.
    Use the newest blame date on those lines. Do not use
    `git log -S '<name>' | tail -1`. That is the first time the name ever
    appeared, so a new export in an old file looks ancient and gets deleted
    inside the waiting window.
  - Skip if that date is within 90 days. For reusable building blocks
    (anything under `ui/components/component-library/` or `ui/components/ui/`,
    or a component, hook, or util that has its own story or README), the
    cutoff is 180 days.
  - Last change: `git log -1 --format='%h %ad %s' --date=short -- <file>`.
    Skip if the file changed in the last 30 days, unless that change only
    touched unrelated lines.
  - Record each skip under Notes with the date it becomes eligible.
- Check open PRs, including drafts. Build this index once per run, before
  proving any candidate:

  ```bash
  for p in 1 2 3 4 5 6 7 8; do
    curl -s "https://api.github.com/repos/MetaMask/metamask-extension/pulls?state=open&per_page=100&page=$p" \
      | jq -r '.[].number'
  done > /tmp/open-prs.txt
  git fetch -q --no-tags origin $(awk '{printf "+refs/pull/%s/head:refs/remotes/pr/%s ", $1, $1}' /tmp/open-prs.txt)
  for r in $(git for-each-ref --format='%(refname:short)' refs/remotes/pr); do
    mb=$(git merge-base origin/main "$r" 2>/dev/null) || continue
    git diff --unified=0 --no-color "$mb" "$r" -- app ui shared test .storybook \
      | rg '^(\+\+\+ |\+[^+])' | sed "s|^|${r#pr/}\t|"
  done > /tmp/open-pr-additions.txt
  ```

  Each line is `<pr>\t<added line>`. Then, for each candidate, run
  `rg -w '<name>' /tmp/open-pr-additions.txt | cut -f1 | sort -u`. Use the
  same search terms as the whole-word check above. Also run
  `rg -F '+++ b/<path>' /tmp/open-pr-additions.txt` to find PRs that edit the
  candidate's own file. If any open PR references the candidate or edits its
  file, skip it and record it under Notes as "used by open PR #N". Recheck it
  once that PR is merged or closed. If any `curl` or `jq` call errors (for
  example on a rate limit), `/tmp/open-prs.txt` is empty, or the fetch fails,
  open nothing this run. You can't prove that nothing in flight depends on
  the code.

If any check is ambiguous, skip the candidate. If it is a detector pattern,
add it to "Notes" or "Do not touch".

## 5. Size the batch

- One kind per PR where possible, in one cohesive area, so one reviewer can
  follow it. Examples:
  - "remove unused files in ui/components/app"
  - "remove unused exports from shared/constants"
  - "remove unused class selectors in ui/pages/swaps"
  - "remove unused imports and locals in ui/pages/settings"
  Mixing kinds A, B, and E for the same feature is fine. A kind D PR may
  include the barrel `@import` removal and the now-unused stylesheet (A/E).
- Target 3-10 touched files and at most ~400 deleted lines. Hard cap: 15 files
  (snapshot files don't count). The repo's PR line check fails above 1000
  changed lines and ignores `*.snap`. For kinds C and D, prefer files from one
  feature folder.
- If more qualifies, take the most self-contained subset and record the rest
  under Notes as the next batch. Later runs open follow-up PRs. Never open
  more than one PR per run.
- A batch with a single file is fine if that is all that is left for the
  owner set.

## 6. Delete and clean up

General:

- Deletions only. Do not refactor, rename, reformat, reorder, or "improve"
  surviving code. The only edits allowed besides deletions are the follow-on
  ones listed below.
- After deleting, remove whatever became unused as a result (imports, helper
  functions, style rules, types), as long as it is in files with the same
  owner set.
- Do not update `development/circular-deps.jsonc`, LavaMoat policies, or
  locale files. If a deletion would force one of those, skip the candidate.
- Remove now-empty directories.

Kind A: delete the file plus its co-located tests, stories, and
`__snapshots__/*.snap`. When the file is a stylesheet, also remove its
`@import` from the aggregating sheet listed in step 3, and only when that
sheet shares the PR's owner set (or both are unowned).

Kind B: delete the declaration and its JSDoc. If a barrel re-exports it,
remove that re-export too. If a test exists only to cover the deleted symbol,
delete that `describe`/`it` block, but never weaken tests of live code. If
that leaves a file empty, delete the file.

Kind C, where side effects matter:

- Unused import binding: remove it. Remove the whole import statement only if
  every binding in it is unused. Never touch bare `import 'x'` side-effect
  imports. Stylesheet imports (`import './index.scss'`) are side-effect
  imports. Never remove one unless kind D deleted that entire stylesheet.
- `const x = <expr>` where only `x` is unused:
  - If `<expr>` is a literal, a pure computation, `useSelector`, `useTheme`,
    `useMemo`, `useCallback`, or `useRef`, remove the whole statement.
  - If `<expr>` may have side effects (`await`, `dispatch`, controller calls,
    analytics, network, storage, or a custom hook that subscribes, fetches,
    tracks, or contains effects), keep the expression and drop only the
    binding, or skip the candidate.
- Destructuring: only remove elements that have no `...rest` sibling.
  Removing an element changes what `rest` contains. `ignoreRestSiblings` in
  the JS detector already hides the safe cases; do not outsmart it.
- Unused private function or local type: delete it.

Kind D:

- Remove the unused ruleset, including its nested declarations. Keep the
  parent selector when a sibling nested class is still used.
- Do not also strip `className` strings from JSX. Kind D deletes selectors
  that nothing applies. A class that is still applied is not dead, even if
  the only styles it had were Tailwind utilities.
- If the stylesheet ends up empty (no rules, no mixins, no placeholders that
  other files extend), delete the file and its barrel `@import` under the
  same owner-set rule as kind A.
- Do not reformat the rest of the stylesheet. stylelint cares about empty
  lines around rules; only fix lines your deletion made invalid.

## 7. Verify (all must pass, or drop the offending change and retry)

- If any `.ts`, `.tsx`, `.js`, or `.jsx` changed: `yarn lint:tsc`
  (heap 6144 via the package script; retry with
  `NODE_OPTIONS=--max-old-space-size=8192` if it is killed).
- Re-run `tsc --noUnusedLocals` on the touched TS files' diagnostics (or
  inspect `/tmp/tsc-unused.log` after a fresh run) and clean up cascades in
  the same owner set.
- `NODE_OPTIONS='--max-old-space-size=8192' yarn eslint <files> -c ./.eslintrc.js --ext js,ts,tsx,snap`.
  Warnings are fine; errors are not. The `yarn lint:eslint` script always
  lints the whole repo; pass paths to `yarn eslint` instead.
- `yarn test:unit --coverage=false <dirs of touched source>`.
  NEVER run jest with `-u` or `--updateSnapshot`. If an existing snapshot
  changes, the code you removed was live. Revert that change and add it to
  "Do not touch". Jest mocks CSS (`test/mocks/style.ts`), so a stylesheet-only
  deletion must not change snapshots. A snapshot diff on a kind D PR means a
  JSX edit leaked in; revert it.
- If any `.scss` or `.css` changed: `yarn lint:styles`. stylelint ignores
  `/app`, so for `app/**/*.css` the reference search is the check. Fix only
  stylelint errors your deletion caused.
- Re-run the whole-word `rg` check for every deleted file, symbol, and class.
- `git status` / `git diff --stat`. Only intended files changed, and every
  touched file resolves to the chosen owner set.

If verification can't pass after dropping problem changes, open nothing.
Record what happened in Notes and stop.

## 8. Open the PR

- Branch name: `cursor/remove-dead-code-<area>-<short>`. Commit message =
  PR title.
- Title (Conventional Commits, checked by `pr-title-linter` in
  `.github/workflows/validate-conventional-commits.yml`). Allowed types
  include `chore`. Examples:
  - `chore(tab-bar): remove unused TabBar helpers`
  - `chore(constants): remove unused URL constants`
  - `chore(swaps): remove unused fee-card class selectors`
- Open as a DRAFT using `.github/pull-request-template.md`. Keep every section
  title. Fill them in:
  - Description: what was removed, the owner set (e.g. "All touched files have
    no CODEOWNERS entry" or "All files owned by @MetaMask/swaps-engineers"),
    and a table with columns path | removed (file / symbol / class) | why
    dead. "Why dead" is one of: zero refs, only own test, unused barrel,
    unused export, unused local, unused class selector, or cascade from X.
    Say "No user-facing behavior change." Name the checks that passed
    (`yarn lint:tsc`, eslint, `yarn test:unit` on the affected directories
    with no snapshot updates, and `yarn lint:styles` when stylesheets
    changed).
  - `CHANGELOG entry: null`
  - Related issues: `Refs: proactive dead-code cleanup (extension counterpart of metamask-mobile#37948)`.
    Do not leave a bare `Fixes:`.
  - Manual testing: `N/A — deletes unreachable code. There is no user-facing
    behavior to click through.`
  - Screenshots: `N/A — no UI change`. Leave the Before/After headings in place
    so the body still matches the template titles.
  - Author checklist: check the items you actually assessed. The labels item
    can stay unchecked until the label is confirmed.
- Labels. Read the PR's labels after opening. If a `team-*` label is already
  present, leave it. If none is present, add `team-design-system`. Internal
  PRs need a `team-*` label (`.github/guidelines/LABELING_GUIDELINES.md`).
  Also assign the PR to `georgewrmarshall` if any available tool supports
  assignees. If labeling or assigning fails, say so in the final reply so a
  human can do it.
- Do not request specific reviewers. CODEOWNERS handles review routing.

## 9. Update Memories and report

- Add the PR to "Open PRs" with its branch, owner set, kind, title, and full
  file and symbol list. Update `current`, `exhausted`, Notes, and
  "Do not touch".
- Keep `MEMORIES.md` under ~200 lines. Prune "Done" entries older than 60 days
  into a one-line count per owner set.
- Final reply: PR link (or why none was opened), whether a `team-*` label and
  the assignee were applied, owner set, what was removed (counts of files,
  symbols, and class selectors), deleted line count, and roughly how many
  candidates of each kind remain for the current owner set.
````

## Notes

- Measured on `main` in Oct 2026, stylesheet scan only. Knip and
  `tsc --noUnusedLocals` counts are not invented here; the first live run
  records them in Memories.
  - The scan parsed `ui/` and `app/` stylesheets, resolved `&` nesting,
    skipped 19 files that contain `#{` interpolation, skipped classes with a
    real dynamic prefix, treated a class as used when a `__` or `--` child
    token exists, and treated `classNames="card"` / `classNames="next-card"`
    as react-transition-group class generators.
  - About 1,650 compiled class selectors were defined. About 220 of them, in
    about 70 stylesheets, had no whole-token reference in source, tests,
    stories, snapshots, or e2e. That is a candidate count. `@extend` targets
    and `mm-*` dependency classes still have to be filtered, as below.
  - Largest clusters: `ui/pages/confirmations/send-utils/send.scss` (leftover
    `.send__*` rules; the current send UI uses `send-header`, `send-asset`,
    and `send-recipient`), `ui/pages/home/index.scss`,
    `ui/pages/swaps/searchable-item-list/index.scss`, and
    `ui/pages/swaps/fee-card/index.scss`.
  - `@extend .class` targets that a token search misses:
    `hold-to-reveal-button__icon` and `hold-to-reveal-button__circle-shared`
    in `ui/components/app/hold-to-reveal-button/index.scss`. The kind D
    detector counts `@extend` as a use.
  - `mm-*` overrides can style classes emitted by `@metamask/*` packages
    rather than by this repo. `snap-install-warning/index.scss` targets
    `.mm-checkbox__input`. Search `node_modules/@metamask` before deleting
    an `mm-` class this repo never renders.
- Jest mocks stylesheets, so unit tests do not prove a class selector was
  unused. The reference search does. Snapshot updates are still forbidden:
  they mean a JSX change, and JSX class names are not kind D.
- `yarn lint:tsc` uses heap 6144. `yarn lint:eslint` uses heap 8192 and
  always passes `.` as the lint root, so path-scoped lint has to call
  `yarn eslint` directly.
- The in-flight PR index is what protects a new component that is only
  referenced from an open PR. If that index cannot be built, the run opens
  nothing.
- The automation never touches feature-flagged code or the deep-link
  security files. Removing a flag after rollout, or changing who sees the
  interstitial, is a separate decision.
