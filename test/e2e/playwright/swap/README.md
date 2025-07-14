# Playwright Swap E2E Testing

This directory contains a set of specific Swap end-to-end tests created using [Playwright](https://playwright.dev/).

## Setup

1. Installing Playwright

If you run the tests for first time, you may need to install the browser dependency (Playwright will inform you in case you need):

```
yarn playwright install chromium
```

2. Prepare the Build:

Use the following command to install all dependencies:

```
yarn
```

3. Build:

Use the following command to generate the Extension build:

```
yarn dist
```

## Running the Tests

From the root of the project, you can use the following scripts to run the tests:

```
yarn test:e2e:swap
```

### Debug test

If you're interested in [debugging tests](https://playwright.dev/docs/debug), we suggest installing the Visual Studio plugin. This will allow you to run each test individually, providing a more streamlined debugging process.

If you don't want to run the tests in headless mode please specify `headless: false` in the following section of the config file `playwright.config.ts` in the root folder:

```
  {
    name: 'swap',
    testMatch: '/playwright/swap/specs/*swap.spec.ts',
    use: {
      ...devices['Desktop Chrome'],
      headless: true,
    },
  },
```

In the same `playwright.config.ts` file you can also specify `fullyParallel: false` if you don't want run the tests in parallel:

## Reports

Test reports are generated in the public folder. To obtain comprehensive, readable reports with direct access to `traces.zip`, run the following script:

```
yarn test:e2e:pw:report
```

Note that the attachment on every test, `trace` provide you with a wealth of useful information for debugging.

![Playwright trace detail](resources/trace.png)

## Contact Swap team

If you encounter any problems while working on these e2e tests, you can write into the Consensys Slack channel `#metaswap-core`.
