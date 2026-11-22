# Bitcoin E2E — local regtest

BTC E2E tests run against a local `bitcoind -regtest` provided by
[`@metamask/bitcoin-regtest-up`](https://www.npmjs.com/package/@metamask/bitcoin-regtest-up),
the Bitcoin equivalent of Foundryup for Anvil.

## Install

```bash
yarn bitcoin-regtest-up:install
```

This downloads a pinned Bitcoin Core release and writes wrappers to:

- `node_modules/.bin/bitcoind`
- `node_modules/.bin/bitcoin-cli`

The archive cache lives under `.metamask/cache/` (already gitignored). Re-run
after a `yarn install` if the wrappers go missing.

## Run a BTC E2E spec

```bash
yarn build:test
yarn test:e2e:single test/e2e/tests/btc/<spec>.spec.ts --browser=chrome
```

The BTC seeder spawns `node_modules/.bin/bitcoind` with a per-run regtest
datadir and JSON-RPC port; the test harness handles wallet creation, funding,
and the Esplora-shaped proxy that the BTC snap calls into.

## Notes

- `bitcoin-regtest-up` is sourced from the npm-published
  `@metamask/bitcoin-regtest-up` package.
- The cache moves to `~/.cache/metamask` only if `.yarnrc.yml` sets
  `enableGlobalCache: true`. This repo keeps it local.
