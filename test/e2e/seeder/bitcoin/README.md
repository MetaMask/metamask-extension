# Bitcoin E2E — local regtest

BTC E2E tests run against a local `bitcoind -regtest` provided by
[`bitcoin-regtest-up`](https://github.com/ulissesferreira/bitcoin-regtest-up),
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

- `bitcoin-regtest-up` is currently sourced from
  `github:ulissesferreira/bitcoin-regtest-up` as a stopgap. Swap to the
  npm-published `@metamask/bitcoin-regtest-up` once
  [MetaMask/core#8827](https://github.com/MetaMask/core/pull/8827) ships.
- The cache moves to `~/.cache/metamask` only if `.yarnrc.yml` sets
  `enableGlobalCache: true`. This repo keeps it local.
