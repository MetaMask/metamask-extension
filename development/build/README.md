# The MetaMask Build System

> _tl;dr_ `yarn dist` for prod, `yarn start` for local development

This directory contains the MetaMask build system, which is used to build the MetaMask Extension such that it can be used in a supported browser.
From the repository root, the build system entry file is located at [`./development/build/index.js`](https://github.com/MetaMask/metamask-extension/blob/develop/development/build/index.js).

Several package scripts invoke the build system.
For example, `yarn start` creates a watched development build, and `yarn dist` creates a production build.
Some of these scripts applies `lavamoat` to the build system, and some do not.
For local development, building without `lavamoat` is faster and therefore preferable.

The build system is not a full-featured CLI, but rather a script that expects some command line arguments and environment variables.
For instructions regarding environment variables, see [the main repository readme](../../README.md#building-locally).

Generally speaking, the build system consists of [`gulp`](https://npmjs.com/package/gulp) tasks that either manipulate static assets or bundle source files using [Browserify](https://browserify.org/).
Production-ready zip files are written to the `./builds` directory, while "unpacked" extension builds
are written to the `./dist` directory.

Our JavaScript source files are transformed using [Babel](https://babeljs.io/), specifically using
the [`babelify`](https://npmjs.com/package/babelify) Browserify transform.
Source file bundling tasks are implemented in the [`./development/build/scripts.js`](https://github.com/MetaMask/metamask-extension/blob/develop/development/build/scripts.js).

> Locally implemented Browserify transforms, _some of which affect how we write JavaScript_, are listed and documented [here](./transforms/README.md).

## Usage

```text
Usage: yarn build <entry-task> [options]

Commands:
  yarn build prod       Create an optimized build for production environments.

  yarn build dev        Create an unoptimized, live-reloaded build for local
                        development.

  yarn build test       Create an optimized build for running e2e tests.

  yarn build testDev    Create an unoptimized, live-reloaded build for running
                        e2e tests.

Options:
  --beta-version      If the build type is "beta", the beta version number.
                                                           [number] [default: 0]
  --build-type        The "type" of build to create. One of: "beta", "main"
                                                      [string] [default: "main"]
  --lint-fence-files  Whether files with code fences should be linted after
                      fences have been removed by the code fencing transform.
                      The build will fail if linting fails.
                      Defaults to `false` if the entry task is `dev` or
                      `testDev`, and `true` otherwise.
                                                   [boolean] [default: <varies>]
  --omit-lockdown     Whether to omit SES lockdown files from the extension
                      bundle. Useful when linking dependencies that are
                      incompatible with lockdown.
                                                      [boolean] [default: false]
  --skip-stats        Whether to refrain from logging build progress. Mostly
                      used internally.
                                                      [boolean] [default: false]
```
