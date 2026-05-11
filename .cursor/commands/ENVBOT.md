---
description: Explain MetaMask build command environments, CI jobs, telemetry targets, feature fences, APIs, OAuth, and signing context
---

# ENVBOT Command

Explain what a MetaMask Extension package command builds and which runtime environments it targets.

Use this command when someone asks questions like:

- `/ENVBOT yarn start`
- `/ENVBOT yarn build:test`
- `/ENVBOT yarn dist:mv2`
- `/ENVBOT yarn build --build-type flask dist`
- `/ENVBOT yarn build:test yarn build:test:flask yarn dist`

## Inputs

The user provides one or more package commands. Treat these as package script names or raw yarn commands.

Accepted examples:

- `yarn start`
- `yarn start:mv2`
- `yarn build:test`
- `yarn build:test:flask`
- `yarn dist`
- `yarn dist:mv2`
- `yarn build dist`
- `yarn build --build-type beta dist`
- `yarn build --build-type flask prod`
- `yarn webpack:lavamoat:build --zip`

If no command is supplied, ask for the package command.

## Core Behavior

For each input command, return one row for Chrome and one row for Firefox whenever a browser counterpart can be inferred.

Use the local repository as source of truth. Do not guess secret values. Do not run builds.

Certainty contract:

- Every value you output must be deduced from files in this repository.
- If a value cannot be deduced from the repository, write `unknown / not directly knowable from repo`.
- Do not fill gaps with product knowledge, memory, assumptions, or likely external configuration.
- If you provide an inference, label it as `inferred` and name the repo evidence that supports it.
- If two repo sources disagree or the result depends on branch/event/secrets, state the condition instead of choosing one unconditional answer.
- Never present a Segment/Mixpanel source name, Sentry project, backend environment, OAuth target, or signing/keystore value as certain unless the repo contains the mapping or the command logic directly implies it.

Always read or search these files before answering:

- `package.json`
- `builds.yml`
- `development/build/constants.js`
- `development/build/index.js`
- `development/build/utils.js`
- `development/build/config.js`
- `development/build/set-environment-variables.js`
- `.github/workflows/main.yml`
- `.github/workflows/run-build.yml`
- `.github/workflows/publish-release-from-release-head.yml`
- `app/scripts/messenger-client-init/remote-feature-flag-controller-init.ts`
- `app/scripts/lib/setupSentry.js`
- `shared/lib/sentry-release.js`
- `app/scripts/services/oauth/config.ts`
- `shared/constants/accounts.ts`
- `shared/constants/bridge.ts`
- `shared/constants/swaps.ts`
- `shared/lib/shield/config.ts`

Also search for exact command strings in `.github/workflows` and `development/webpack` if the command is a webpack command.

## Step 1: Resolve The Command

1. Resolve `yarn <script>` through `package.json:scripts`.
2. Expand script chains until the underlying build target is visible.
3. Capture inline env prefixes such as `ENABLE_MV3=false`, `BLOCKAID_FILE_CDN=...`, `SEGMENT_WRITE_KEY=...`, and `SEGMENT_HOST=...`.
4. Capture build type from `--build-type <type>` or `--type <type>`.
5. If no build type is set, use `builds.yml:default` (`main`).
6. Capture build target:
   - Browserify:
     - `yarn build:dev dev` or `yarn build dev` -> `dev`
     - `yarn build dist` -> `dist`
     - `yarn build prod` -> `prod`
     - `yarn build test` -> `test`
     - `yarn build:dev testDev` -> `testDev`
   - Webpack:
     - `--mode development` or dev server/watch -> development
     - `--test` -> testing
     - `--env production` -> production
     - production mode without `--env production` -> staging / release-candidate / pull-request / other, depending on GitHub context
7. Capture bundler:
   - `development/build/index.js` or `yarn build ...` -> `browserify`
   - `development/webpack` or `webpack:lavamoat:*` -> `webpack`

## Step 2: Resolve Browser Rows

Output `chrome` and `firefox` rows using these rules:

- Chrome means MV3 unless the command explicitly disables MV3.
- Firefox means MV2 and uses `ENABLE_MV3=false`.
- Package scripts with `:mv2` are Firefox-specific. Pair them with the closest non-`:mv2` script for the Chrome row when it is obvious.
- Package scripts without `:mv2` usually represent the Chrome/MV3 counterpart. Pair them with the closest `:mv2` package script or CI job for Firefox when it is obvious.
- In CI, `.github/workflows/run-build.yml` sets `ENABLE_MV3` from `contains(inputs.build-name, 'mv2')`.
- If no counterpart exists, write `No direct counterpart found`.

## Step 3: Resolve GitHub Action Trigger

Find the workflow job in `.github/workflows/main.yml` or `.github/workflows/publish-release-from-release-head.yml` that passes the matching `build-command` into `.github/workflows/run-build.yml`.

Common Browserify job mapping:

| Build type | Target | Chrome job | Firefox job |
| --- | --- | --- | --- |
| `main` | `dist` | `build-dist-browserify` | `build-dist-mv2-browserify` |
| `beta` | `dist` | `build-beta-browserify` | `build-beta-mv2-browserify` |
| `flask` | `dist` | `build-flask-browserify` | `build-flask-mv2-browserify` |
| `main` | `test` | `build-test-browserify` | `build-test-mv2-browserify` |
| `flask` | `test` | `build-test-flask-browserify` | `build-test-flask-mv2-browserify` |
| `main` | `prod` | `build-dist-browserify` in `publish-release-from-release-head.yml` | `build-dist-mv2-browserify` in `publish-release-from-release-head.yml` |
| `flask` | `prod` | `build-flask-browserify` in `publish-release-from-release-head.yml` | `build-flask-mv2-browserify` in `publish-release-from-release-head.yml` |

Common Webpack job mapping:

| Build type | Target | Chrome job | Firefox job |
| --- | --- | --- | --- |
| `main` | `dist` | `build-dist-webpack` | `build-dist-mv2-webpack` |
| `beta` | `dist` | `build-beta-webpack` | `build-beta-mv2-webpack` |
| `flask` | `dist` | `build-flask-webpack` | `build-flask-mv2-webpack` |
| `main` | `test` | `build-test-webpack` | `build-test-mv2-webpack` |
| `flask` | `test` | `build-test-flask-webpack` | `build-test-flask-mv2-webpack` |
| `main` | `prod` | `build-dist-webpack` in `publish-release-from-release-head.yml` | `build-dist-mv2-webpack` in `publish-release-from-release-head.yml` |
| `flask` | `prod` | `build-flask-webpack` in `publish-release-from-release-head.yml` | `build-flask-mv2-webpack` in `publish-release-from-release-head.yml` |

For `yarn start`, `yarn start:mv2`, `test:e2e:*`, unit tests, storybook, and devtool commands, say `No direct build artifact job; local/dev command` unless a workflow directly invokes it.

## Step 4: Resolve Env Source

Use `development/build/config.js`.

Variable priority, highest first:

1. Hardcoded build code in `set-environment-variables.js`
2. Process environment variables
3. `.metamaskprodrc`
4. `.metamaskrc`
5. `builds.yml` build type env
6. `builds.yml` feature env
7. `builds.yml` root env

Report env source as:

- Local commands: `local .metamaskrc/.metamaskprodrc + shell env + builds.yml defaults`
- GitHub Actions: `GitHub Secrets/Vars via run-build.yml + builds.yml defaults`
- Test helper scripts that include `yarn env:e2e`: `inline env:e2e overrides SEGMENT_HOST/SEGMENT_WRITE_KEY + local or CI source`

## Step 5: Resolve METAMASK_BUILD_TYPE

Use:

- CLI `--build-type` / webpack `--type`
- Package wrappers such as `start:flask`, `build:test:beta`, `build:test:flask`
- Otherwise `builds.yml:default`, which is `main`

Allowed primary targets for this command:

- `main`
- `flask`
- `beta`

If the command uses `experimental`, report it as `experimental` and note that some integrations map it to `main` distribution with a special experimental remote-flag environment.

## Step 6: Resolve METAMASK_ENVIRONMENT

Use `development/build/utils.js:getEnvironment()` for Browserify:

- Build target `prod` -> `production`
- Build target `dev` or `testDev` -> `development`
- Build target `test` -> `testing`
- Build target `dist` on `release/x.y.z` branch -> `release-candidate`
- Build target `dist` on `main` branch -> `staging`
- Build target `dist` during `pull_request` event -> `pull-request`
- Otherwise -> `other`

For local `yarn dist` with no GitHub env, report `other`.
For CI `main.yml` dist builds, report a context-dependent value: `staging` on `main`, `release-candidate` on `release/*`, `pull-request` on PRs, otherwise `other`.
For publish release workflow `prod` builds, report `production`.

## Step 7: Resolve Launch Darkly / Remote Feature Flag Target

Use `app/scripts/messenger-client-init/remote-feature-flag-controller-init.ts`.

Distribution mapping:

- `main` -> `main`
- `flask` -> `flask`
- `beta` -> `beta`
- `experimental` -> `main` distribution
- Unknown -> `main`

Environment mapping:

- `development` -> `dev`
- `production` -> `prod`
- `release-candidate` -> `rc`
- Anything else (`testing`, `staging`, `pull-request`, `other`) falls back to `dev`
- `experimental` build type overrides the environment to experimental; call this out because it is outside the standard list

Report one of:

- `main-dev`, `flask-dev`, `beta-dev`
- `main-prod`, `flask-prod`, `beta-prod`
- `main-rc`, `flask-rc`, `beta-rc`
- `main-exp` for experimental special case

## Step 8: Resolve Sentry Project And Sentry Env

Use `app/scripts/lib/setupSentry.js`, `shared/lib/sentry-release.js`, and `development/README.md`.

Sentry environment:

- If build type is `main`, Sentry env is exactly `METAMASK_ENVIRONMENT`.
- If build type is not `main`, Sentry env is `${METAMASK_ENVIRONMENT}-${METAMASK_BUILD_TYPE}`.

Examples:

- `main` + `development` -> `development`
- `main` + `testing` -> `testing`
- `flask` + `staging` -> `staging-flask`
- `beta` + `production` -> `production-beta`
- `flask` + `release-candidate` -> `release-candidate-flask`
- `beta` + `pull-request` -> `pull-request-beta`

Sentry target:

- If `IN_TEST` and `SENTRY_DSN_DEV` is absent -> fake DSN / no events
- If `manifestFlags.ci.enabled` and `SENTRY_DSN_PERFORMANCE` exists -> performance DSN, errors ignored
- If `METAMASK_ENVIRONMENT !== production` -> `SENTRY_DSN_DEV`
- If `METAMASK_ENVIRONMENT === production` -> `SENTRY_DSN`

Report Sentry project as:

- `metamask-extension` for production DSN / production release prefix
- `metamask-extension-test` for non-production release prefix or fake/test target
- If performance DSN is active, report `metamask-performance` and note that app errors are ignored by setup

## Step 9: Resolve Segment / Mixpanel Source

Use `development/build/set-environment-variables.js:getSegmentWriteKey()` and `builds.yml`.

Rules:

- If `METAMASK_ENVIRONMENT !== production`, `SEGMENT_WRITE_KEY` is used directly.
- If production, `SEGMENT_WRITE_KEY_REF` is read from `builds.yml`, then dereferenced:
  - `main` -> `SEGMENT_PROD_WRITE_KEY`
  - `beta` -> `SEGMENT_BETA_WRITE_KEY`
  - `flask` -> `SEGMENT_FLASK_WRITE_KEY`
  - `experimental` -> `SEGMENT_EXPERIMENTAL_WRITE_KEY`
- `yarn env:e2e` sets `SEGMENT_HOST=https://api.segment.io` and `SEGMENT_WRITE_KEY=FAKE`.

The human source name is not stored in this repo. Use this mapping only as a labeled inference and say `inferred from write-key ref / command context`; otherwise write `unknown / not directly knowable from repo`.

| Context | Chrome source | Firefox source |
| --- | --- | --- |
| `dev`, `main` | `MetaMask Extension [Dev]` | `MetaMask Extension [Dev MV2]` |
| `dev`, `flask` | `MetaMask Extension [Flask Dev]` | `MetaMask Extension [Flask Dev MV2]` |
| `dev`, `beta` | `MetaMask Extension [Beta Dev]` | `MetaMask Extension [Beta Dev]` |
| `test`, `main`, no LavaMoat | `MetaMask Extension [Test]` | `MetaMask Extension [Test MV2]` |
| `test`, `main`, LavaMoat | `MetaMask Extension [Dev Lavamoat]` | `MetaMask Extension [Dev Lavamoat]` |
| `test`, `beta` | `MetaMask Extension [Beta Test]` | `MetaMask Extension [Beta Test]` |
| `production`, `main` | `MetaMask Extension [Prod]` | `MetaMask Extension [Prod]` |
| `release-candidate`, `main` | `MetaMask Extension [RC]` | `MetaMask Extension [RC MV2]` |
| `release-candidate`, `flask` | `MetaMask Extension [Flask RC]` | `MetaMask Extension [Flask RC MV2]` |

If the command context is `staging`, `pull-request`, or `other`, report the resolved write key source (`SEGMENT_WRITE_KEY` or production ref) and mark the human source name as `not directly knowable from repo`.

## Step 10: Resolve Code Fencing And Features

Use `builds.yml` plus CLI `--features`.

Active features are `union(additionalFeatures, builds.yml.buildTypes[buildType].features)`.

Current build type features:

- `main`: `keyring-snaps`, `multi-srp`, `bitcoin`, `tron`
- `beta`: `build-beta`, `keyring-snaps`, `bitcoin`, `multi-srp`, `tron`
- `flask`: `build-flask`, `keyring-snaps`, `bitcoin`, `tron`, `multi-srp`
- `experimental`: `build-experimental`, `keyring-snaps`, `multi-srp`, `bitcoin`, `tron`

Feature combination descriptions:

- `main`: Core MetaMask build, production branding, keyring snaps, multi-SRP, Bitcoin, Tron
- `beta`: Beta branding and support link, prerelease versioning, keyring snaps, multi-SRP, Bitcoin, Tron
- `flask`: Flask branding, experimental/canary snaps and local snaps allowed, relaxed snap allowlist, keyring snaps, multi-SRP, Bitcoin, Tron
- `experimental`: Experimental branding/dev options, keyring snaps, multi-SRP, Bitcoin, Tron

If the user mentions old or expected fence names that are not active features in current `builds.yml` (for example `build-main`, `multichain`, `solana`, `solana-swaps`), report `not present as build fences in current builds.yml` unless supplied by `--features`.

## Step 11: Resolve Backend APIs

Report the primary backend API posture as one of `dev`, `prod`, `uat`, or mixed.

Use these rules:

- Accounts API:
  - `ACCOUNTS_USE_DEV_APIS=true` -> `dev`
  - otherwise -> `prod`
- Bridge API:
  - `BRIDGE_USE_DEV_APIS=true` -> `dev`
  - otherwise -> `prod`
- Swaps API:
  - `SWAPS_USE_DEV_APIS=true` -> `dev`
  - otherwise -> `prod` for bridge API, while gas dev constant points to `uat` when the dev flag is used
- Shield:
  - `beta` -> `uat`
  - `main`, `flask`, `experimental` -> `prod`
  - dev/test environment does not currently override Shield because `loadShieldConfig()` keys off build type
- Rewards/geolocation and some ramps use environment-specific UAT/prod logic. If relevant, note:
  - production/release-candidate -> prod
  - non-production QA/dist contexts may use uat where the specific module chooses UAT

If multiple services differ, write `mixed` and list the important differences.

## Step 12: Resolve OAuth Integration

Use `app/scripts/services/oauth/config.ts` and `development/build/set-environment-variables.js:getOAuthClientId()`.

Runtime OAuth config:

- `main` or `experimental`:
  - `production` or `release-candidate` -> `prod`
  - `development` or `testing` -> `dev`
  - otherwise -> `uat`
- `flask`:
  - `production` or `release-candidate` -> `prod` Flask
  - `development` or `testing` -> `dev` Flask
  - otherwise -> `uat` Flask
- `beta` -> `prod` OAuth config

Build-time OAuth client ID source:

- Production and release-candidate use `${PROVIDER}_CLIENT_ID_REF` from `builds.yml`, then dereference CI/local secrets.
- Development and testing use direct `GOOGLE_CLIENT_ID` / `APPLE_CLIENT_ID`.
- Other non-production contexts use UAT client IDs (`GOOGLE_CLIENT_ID_UAT`, `APPLE_CLIENT_ID_UAT`, or Flask UAT variants).

Report both:

- `OAuth integration`: `dev`, `uat`, `prod`, `dev Flask`, `uat Flask`, or `prod Flask`
- `OAuth client ID source`: direct env vars, UAT env vars, or ref-based prod secrets

## Step 13: Resolve Keystore / Signing Context

This repository is the browser extension, not an Android app. Do not invent Android keystores such as `debug`, `release`, `internalRelease`, `betaRelease`, `betaInternalRelease`, `flaskRelease`, or `flaskInternalRelease` unless a file in this repository explicitly maps the command to them.

For the browser extension, report:

- Chrome non-production / release-candidate builds use fixed manifest keys for stable extension IDs.
- Chrome production builds do not set a fixed manifest key; Chrome Web Store signing applies outside this build command.
- Firefox builds do not use a manifest key because the extension ID comes from `applications.gecko.id`.
- Production publishing uses `publish-release-from-release-head.yml`, `EXTENSION_PUBLISH_TOKEN`, and the Firefox bundle script token, not an Android-style keystore.

If the user explicitly asks for one of the Android-style keystore labels, answer `Not applicable in metamask-extension browser build; no repo mapping found`.

## Step 14: Resolve "Used For" Description

Use the build target and package script intent:

- `dev`: Local development build with live reload. Usually `yarn start`, `yarn start:mv2`, `yarn start:flask`, or `yarn start:beta`.
- `testDev`: Local or CI-adjacent unoptimized test build for faster E2E debugging. Usually `yarn start:test` variants.
- `test`: CI/E2E test build artifact for automated testing and E2E execution. Usually `yarn build:test` variants.
- `dist`: Production-like distributable for QA, prerelease artifacts, PR validation, main branch staging, or release-candidate builds depending on branch/event.
- `prod`: Production release build generated by the release publishing workflow.
- Webpack `--test`: Webpack test artifact for E2E/benchmark coverage.
- Webpack production mode: Webpack production-like artifact for bundle validation and comparison with Browserify.

For build types, add the distribution intent:

- `main`: standard MetaMask Extension
- `flask`: MetaMask Flask canary/experimental distribution
- `beta`: MetaMask Beta distribution
- `experimental`: experimental distribution

## Output Format

Start with a short summary:

`Resolved <command> as <bundler> <target> build, build type <type>.`

Then output one block per command/browser pair. Do not use a wide markdown table.

Use this format:

```text
Command: <command>
Browser: <chrome|firefox>
GitHub Action job: <job or no direct job>
Env source: <source>
METAMASK_BUILD_TYPE: <value>
METAMASK_ENVIRONMENT: <value>
Remote flags target: <target>
Sentry project: <project>
Sentry env: <env>
Segment/Mixpanel source: <source or unknown>
Code fences/features: <features>
Feature combination: <description>
Backend APIs: <dev|prod|uat|mixed plus notes>
OAuth integration: <target plus client ID source>
Keystore/signing: <browser signing context>
Used for: <description>
```

Separate blocks with a blank line and `---`.

Keep each line compact. If a field is context-dependent, write the condition, for example:

- `staging on main, release-candidate on release/*, pull-request on PR, other locally`
- `GitHub Secrets via run-build.yml; local uses .metamaskrc`
- `inferred: MetaMask Extension [RC]`

After the table, include a short `Evidence` list with the files/functions used. Include line references if available from the tool output.

## Accuracy Rules

- Prefer `unknown / not directly knowable from repo` over guessing. This is mandatory, not stylistic.
- Everything announced as fact must be certain and deduced from the codebase.
- Do not treat examples in the user request as facts unless they are confirmed in repo files.
- Do not use external product knowledge to fill missing mappings.
- For each non-obvious table value, be prepared to cite the file/function that proves it.
- Distinguish local command behavior from CI behavior.
- Distinguish build target (`test`, `dist`, `prod`) from build type (`main`, `flask`, `beta`).
- Distinguish `METAMASK_ENVIRONMENT` from Sentry env; Sentry appends build type for non-main builds.
- Distinguish Sentry DSN project from Sentry release prefix where needed.
- Distinguish feature fences in `builds.yml` from runtime remote feature flags.
- For branch-sensitive outputs, always say which branch/event changes the result.
