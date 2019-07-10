# End-to-end tests

# Quick start

To run the tests in Firefox:

```bash
BROWSER=firefox npx mocha --no-timeouts e2e/tests/**/*.spec.js
```

To run the tests in Chrome:

```bash
BROWSER=chrome npx mocha --no-timeouts e2e/tests/**/*.spec.js
```

Both commands listed above assume a current working directory of the project root.
