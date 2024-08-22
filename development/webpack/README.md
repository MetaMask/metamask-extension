# MetaMask Development Build Tool

This tool is used to build the MetaMask extension for development purposes. It is not (yet) intended for production builds.

## Usage

For usage, examples, and options, run the following command:

```bash
yarn webpack --help
```

To build the MetaMask extension, run the following command:

```bash
yarn webpack
```

This will create a `dist/chrome` directory containing the built extension. See usage for more options.

To watch for changes and rebuild the extension automatically, run the following command:

```bash
yarn webpack --watch
```

### Set options using a `config.json` file

You can skip using command line options and specify options using a JSON file
instead. You can use the same options as the command line, but in JSON form. For
example, to build a zip of the extension for Chrome and Firefox, create a
`config.json` file as follows (notice the use of an array for the `browser`
option):

```json
{
  "browser": ["chrome", "firefox"],
  "zip": true
}
```

Then you can use it as follows:

```bash
yarn webpack --config config.json
```

And you can combine it with CLI options, too:

```bash
yarn webpack --config config.json --dry-run
```

Run `yarn webpack --help` for the list of options.

### Set options using environment variables

You can use environment variables instead of command line options:

```bash
BUNDLE_MINIFY=true yarn webpack
```

Run `yarn webpack --help` for the list of options.

Note: multiple array options cannot be set this way, due to this bug in yargs: https://github.com/yargs/yargs/issues/821

You can also combine environment variables with `--config` and CLI options:

```bash
BUNDLE_MINIFY=true yarn webpack --config config.json --dry-run
```

## Cache Invalidation

The cache is invalidated when the build tool's code itself changes, or when the `package.json` file changes. The cache
is keyed by the effective options, so changing the options will also invalidate the cache. Not all options affect
the cache, but most do. Search for "`cacheKey`" in [./utils/cli.ts](./utils/cli.ts) to see which options affect the cache.

## Tips

- You can use the `--config` flag to specify your own JSON config file to use as the build configuration. This is useful
  if you want to customize the defaults
- You can specify options via environment variables by prefixing the option name with `BUNDLE_`, e.g.,
  `BUNDLE_BROWSER=opera yarn webpack` on \*nix.
- don't run the build process with the Node Debugger attached; it will make things build much more slowly.

## Development

### Debugging the Build Process

Webpack makes use of a cache to speed up builds. If you encounter issues with the build tool, try clearing the cache by
running the following command:

```bash
yarn webpack:clearcache
```

You can also avoid using the cache by setting the `--no-cache` option.

```
yarn webpack --no-cache
```

Please to file an issue if you do encounter issues!

### Linting

Linting is exactly the same as the rest of the MetaMask project. To lint the build tool, run the following command:

```bash
yarn lint
```

That said, the webpack build has its [own eslint configuration](./.eslintrc.js) that overrides some restrictive rules
that either: don't work well when optimizing for performance, or disable JavaScript features that are useful and
generally necessary.

### Testing

To run the build tool's test suite, run the following command:

```bash
yarn test:unit:webpack
```

This will run the test suite for the build tool. These tests are also run as part of the MetaMask test suite in CI.

To output an HTML, JSON, and text coverage reports, run the following command:

```bash
yarn test:unit:webpack:coverage
```

Test coverage should be around 100% for the build tool, exceptions are made for some edge cases that are overly
difficult or complex to test, like exceptions.

Testing uses node's built-in `node:test` and `node:assert` modules instead of jest/mocha.

Unit tests are organized in `development/webpack/test` and are named `*.test.ts`, where \* is the name of the file being
tested. This is a guideline and not a rule.

When checking coverage its is sometimes good to check if your coverage is intentional. One way to do that is to run the
test coverage on a single test file. This can be done by running the following command:

```bash
yarn nyc --reporter=html tsx --test development/webpack/test/your-test-file.test.ts
```

### Performance

The build tool only exists to build the project quickly. Don't make it slow. If you're adding a feature that makes the
build tool slower, go for a walk and maybe don't come back until you change your mind.

Some things that might make the build tool slower:

- using JavaScript (this tool is only fast because it uses [SWC](https://swc.rs/) for compilation, which is written in
  Rust)
- requiring/importing large libraries
- functional programming paradigms (JavaScript is not Haskell after all)
  - like chaining map, filter, reduce, etc. when a single loop would do.
  - try to avoid looping over the same data/file multiple times
- using async IO when sync IO would do
  - non-blocking IO is great, but not when it's the only IO happening at the time and we don't care about blocking the
    main process.
- launching shells, workers, or other processes without measuring the cost
- unnecessary IO
- validation, linting, or other checks that are not necessary

If you must add something that slows it down, consider putting it behind a flag. If it must be in the default mode, try
to run it in parallel with other tasks.

### The Cache

The build process uses a cache to speed up successive builds. The cache is stored in the `node_modules/.cache/webpack`
directory.

The cache is slow. Very slow. It takes about 50% of the total time just to create the cache. But you shouldn't notice
that because the caching step is pushed to a background process.

The way this works is by running the build in a background child process, and then detaching that child process from the
parent process once the build is complete (and cache reconciliation and persistance begins).

Launching the build in a background process does take time, but its much less time than cache creation, so it works out.

The child process is run with its own TTY for `stderr` and `stdout`; the child's stdio dimensions are kept in sync with
the parent's, and all TTY features of the parent are available in the child (formatting, colors, cursors, etc.). On
Windows an IPC channel is used to communicate between the parent and child processes, on \*nix this is done via signals.
The parent process listens for the child process and signal the parent, and when it does, the parent disconnects from
the child and shuts down, leaving the child to run in the background so the cache can be processed and persisted.

### To do:

- [define and wrangle the difference between `lockdown` and `lavamoat` options.](https://github.com/MetaMask/metamask-extension/issues/26254)
- [MV3 support](https://github.com/MetaMask/metamask-extension/issues/26255)
  - Service workers, used by MV3, must load dependencies via `importScripts`.
  - there are existing webpack plugins that do this, but they are not yet integrated into this build tool and would
    require changes to our code and existing gulp-based build process to work.
- [Make lavamoat work so we can run production builds](https://github.com/MetaMask/metamask-extension/issues/26256)
- [Make LiveReload, Hot Module Reloading, and/or React Refresh work](https://github.com/MetaMask/metamask-extension/issues/26257)
  - prerequisite: https://github.com/MetaMask/metamask-extension/issues/22450
- [Make the build tool even faster (switch to RSPack once it hits 1.0.0?)](https://github.com/MetaMask/metamask-extension/issues/26258)
- [enable `yarn webpack completion`](https://github.com/MetaMask/metamask-extension/issues/26259)
  - It doesn't work with multiple-word commands (`yarn webpack ...`) and is currently disabled.
- [implement overrides for icons and manifests fields for non-main builds](https://github.com/MetaMask/metamask-extension/issues/26260)

### Ideas

- investigate using `DLLPlugin` for even faster builds
- make it work in Bun.js and/or Deno
- investigate adding a long-running background daemon mode for always up-to-date builds
- investigate adding linting, testing, validation, AI code review, etc.; especially in `--watch` mode
- investigate a "one CLI to rule them all" approach to MetaMask developer tooling and scripts
- allow changing some options without restarting the build process
