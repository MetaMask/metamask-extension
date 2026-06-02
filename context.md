# E2E Local Chain Seeding Context

## Goal

Bring Bitcoin, Solana, and Tron E2E setup closer to the existing EVM fixture model:

- EVM uses `withFixtures` plus Anvil seeding to predeploy contracts and give the default fixture account useful state.
- Tron should mirror this with real contracts where appropriate.
- Bitcoin should not have tokens or NFTs, only accounts, balances, UTXOs, and transaction history.
- Solana should use Solana-native primitives: programs, mints, token accounts, metadata accounts, and account/program snapshots.
- Tron and Solana should each support two test-prep paths: rawer state paths and higher-level account assets with token metadata/prices.

## EVM Baseline

The EVM reference point is the Anvil smart contract seeder:

- `test/e2e/seeder/anvil-seeder.js`
- Contracts are deployed selectively through `withFixtures({ smartContract: [...] })`.
- ERC20 contracts can mint in constructors, while ERC721/ERC1155 mint after deployment.
- Existing `withTokenController` / `withTokensControllerERC20` fixture helpers add token state to the wallet when needed.
- Network state JSON files under `test/e2e/seeder/network-states` can also preload Anvil storage.

The design target for non-EVM chains is not to copy EVM internals literally, but to provide a similarly ergonomic fixture-level API.

## Tron

Tron was implemented first.

Key decisions:

- Keep everything in this repo for now because there is no `@metamask/test-dapp-tron` package yet.
- Use real local TRC20 contract artifacts instead of a fake permissive bytecode helper.
- Abstract contract deployment and balance seeding behind a `TronSeeder`.
- Expose contract addresses through a registry, similar in spirit to EVM contract address lookup.
- Let `withTronFixtures` remain the parent abstraction for specs.
- Support `tronState` / `loadState` JSON files that can contain raw balance maps or fixture-style `accounts[].assets`.

Important files:

- `test/e2e/seeder/tron/contracts/test-trc20.ts`
- `test/e2e/seeder/tron/smart-contracts.ts`
- `test/e2e/seeder/tron/state.ts`
- `test/e2e/seeder/tron/tron-seeder.ts`
- `test/e2e/seeder/tron/node.ts`
- `test/e2e/tests/tron/fixtures/with-tron-fixtures.ts`
- `test/e2e/helpers/tron-seeder.test.ts`
- `test/e2e/helpers/tron-state.test.ts`
- `test/e2e/helpers/tron-assets.test.ts`
- `test/e2e/helpers/tron-fixtures.test.ts`

The fixture-facing Tron model is account asset based:

```ts
await withTronFixtures({
  tronState: 'test/e2e/seeder/tron/network-states/with-usdt.json',
  accounts: [
    {
      address,
      assets: [
        { type: 'native', symbol: 'TRX', balance: 6072392, decimals: 6 },
        {
          type: 'trc20',
          symbol: 'USDT',
          balance: '2804595',
          decimals: 6,
          priceUsd: 1,
        },
      ],
    },
  ],
});
```

## Open Follow-Ups

- Longer term, move shared chain test assets into dedicated test-dapp packages where appropriate.
