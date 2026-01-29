# Dev Environment Guardrails

- Use the repo-specified Node version
- Copy `.metamaskrc.dist` to `.metamaskrc` (never commit it)
- If switching branches causes build issues, clear artifacts:
  - `rm -rf dist builds .cache`
