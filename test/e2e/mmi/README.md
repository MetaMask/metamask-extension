# Playwright MMI E2E Testing

This directory contains a subset of MMI end-to-end tests created using [Playwright](https://playwright.dev/).

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

To run visual tests, you need to generate a Docker image. This ensures that the screenshots are consistent with the operating system used in the pipeline. The `package.json` file in this directory simplifies the Docker image build process, as it only requires Playwright and test-related components. The Metamask build dependencies are not required as the extension is already built.

## Reports

Test reports are generated in the public folder. To obtain comprehensive, readable reports with direct access to `traces.zip`, run the following script:
```
yarn test:pw:report
```