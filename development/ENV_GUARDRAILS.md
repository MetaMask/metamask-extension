# Dev Environment Guardrails

A short checklist to reduce "works on my machine" friction.

## Node / Yarn

- Use the repo-specified Node version.
- Run the repo's setup command (not a generic install).

## Local config

- Copy `.metamaskrc.dist` to `.metamaskrc`.
- Never commit `.metamaskrc`.

## Common gotchas

- If a build fails after switching branches, remove build artifacts:
  - `rm -rf dist builds .cache`
- If dependencies drift:
  - re-run setup and ensure lockfile is unchanged unless intended.
