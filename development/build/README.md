# The MetaMask Build System

> _tl;dr_ `yarn dist` for prod, `yarn start` for local development.
> Add `--build-type flask` to build Flask, our canary distribution with more experimental features.

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

See `node ./development/build/index.js --help`
