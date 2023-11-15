# Playwright MMI E2E Testing

This directory contains a set of specific MMI end-to-end tests created using [Playwright](https://playwright.dev/). These tests are part of the MMI quality legacy framework.

## Setup

To prepare your environment for the MMI E2E test suite, follow these steps:

1. Create a `.env` file in this directory to store the configuration parameters for the MMI E2E test suite. Please consult with your MMI colleagues to obtain these values.

2. Generate a specific MMI build:

    2.1. Add the `.metamaskrc` file to the root directory. This file is necessary for generating the build and points to the development environments.

    2.2. Use the following script to generate the build:
    ```
    yarn dist:mmi
    ```

## Running the Tests

From the root of the project, you can use the following scripts to run the tests:

- To run all tests:
  ```
  yarn test:e2e:mmi
  ```

> Note: If you run the tests for first time, you may need to install the browser dependency (Playwright will inform you in case you need):
> ```
> yarn playwright install chromium
>```

- To run visual tests:
  ```
  yarn test:e2e:mmi:visual
  ```
- To update visual screenshots, if required:
  ```
  yarn test:e2e:mmi:visual:update
  ```

## Visual Tests

For more information on visual tests, refer to the [Playwright documentation](https://playwright.dev/docs/test-snapshots).

Running visual tests requires the generation of a Docker image. This ensures that the screenshots are consistent with the operating system used in the pipeline. All required to build this image is described in file `test/e2e/mmi/Dockerfile`. The actual process to build, call the tests and tierdown files is defined in `test/e2e/mmi/scripts/run-visual-test.sh`.

## Reports

Test reports are generated in the public folder. To obtain comprehensive, readable reports with direct access to `traces.zip`, run the following script:
```
yarn test:e2e:pw:report
```