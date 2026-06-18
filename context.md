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
        { type: 'trc20', symbol: 'USDT', balance: '2804595', decimals: 6, priceUsd: 1 },
      ],
    },
  ],
});
```

## Bitcoin

Bitcoin was intentionally kept much simpler.

Key decisions:

- No token or NFT model.
- `withBitcoinFixtures` should instantiate accounts with native balance and optional transaction history.
- The fixture-facing field is `balance`, not `balanceBtc`, matching the Tron native asset naming style.
- The Bitcoin local node now derives regtest funding addresses and script hashes from SegWit fixture addresses, rather than only supporting the default E2E BTC address.
- Esplora transaction history can be supplied per account and indexed by script hash and txid.
- UTXOs and balances still come from the local regtest node.

Important files:

- `test/e2e/seeder/bitcoin/node.ts`
- `test/e2e/tests/btc/fixtures/with-bitcoin-fixtures.ts`
- `test/e2e/tests/btc/mocks/local-bitcoin-node-mocks.ts`
- `test/e2e/helpers/bitcoin-fixtures.test.ts`

Fixture shape:

```ts
accounts: [
  {
    address: DEFAULT_BTC_ADDRESS,
    balance: 0.5,
    transactions: [esploraTransaction],
  },
]
```

Validation performed:

- `yarn test:unit test/e2e/helpers/bitcoin-fixtures.test.ts --runInBand`
- `yarn lint:changed`
- `git diff --check`
- A live Bitcoin regtest smoke verified funding a second account with `0.02 BTC`, producing a `2,000,000` sat UTXO and mapping the transaction output back to the fixture address.

## Solana

Solana now mirrors the Tron fixture shape at the abstraction layer while using Solana-native mechanics underneath.

Implemented state:

- `test/e2e/seeder/solana/node.ts` starts `solana-test-validator`, accepts `loadState`, and turns state manifests into validator startup arguments.
- `test/e2e/seeder/solana/solana-seeder.ts` creates local SPL Token, Token-2022, and NFT-style mints, creates token accounts, and mints balances to fixture accounts.
- `test/e2e/tests/solana/fixtures/with-solana-fixtures.ts` supports legacy native balances plus the newer `accounts[].assets` shape.
- `test/e2e/tests/solana/mocks/local-solana-node-mocks.ts` proxies JSON-RPC calls to the local validator.
- Token API and spot-price mocks are generated from fixture assets, using local mint addresses from the Solana asset registry when assets are seeded.

Fixture model:

```ts
await withSolanaFixtures({
  solanaState: 'test/e2e/seeder/solana/network-states/with-usdc',
  accounts: [
    {
      address: DEFAULT_FIXTURE_SOLANA_ACCOUNT,
      assets: [
        { type: 'native', symbol: 'SOL', name: 'Solana', balance: 50, decimals: 9, priceUsd: 180.5 },
        { type: 'spl-token', symbol: 'USDC', name: 'USD Coin', decimals: 6, balance: '8908267', priceUsd: 1 },
        { type: 'spl-token-2022', symbol: 'TEST22', name: 'Token 2022', decimals: 6, balance: '1000000' },
        { type: 'nft', name: 'Test NFT', symbol: 'TNFT', uri: 'https://example.test/metadata.json' },
      ],
    },
  ],
});
```

Important Solana caveats:

- Solana does not deploy one contract per token like EVM or Tron TRC20.
- SPL assets are accounts owned by shared programs.
- If tests need canonical mainnet mint addresses such as USDC `EPjFW...`, those cannot normally be created locally because we do not own those keypairs. Prefer generated local mints plus mocked metadata/prices, or use account snapshots when an exact address is required.

## Solana State Path Idea

Solana can support a state-path style setup, but it should be account/program based rather than storage-slot based.

`solana-test-validator` supports:

- `--account <ADDRESS> <DUMP.JSON>`
- `--account-dir <DIRECTORY>`
- `--bpf-program <PROGRAM_ID> <PROGRAM.so>`
- `--upgradeable-program <PROGRAM_ID> <PROGRAM.so> <AUTHORITY>`
- `--clone <ADDRESS>`
- `--clone-upgradeable-program <ADDRESS>`

Implemented shape:

```ts
await withSolanaFixtures({
  solanaState: 'test/e2e/seeder/solana/network-states/with-usdc',
});
```

Example folder:

```text
with-usdc/
  manifest.json
  accounts/
    usdc-mint.json
    user-usdc-token-account.json
  programs/
    test-program.so
```

The manifest would define which account dumps and program binaries should be passed to `solana-test-validator` at genesis.

State-path fit:

- Good for balances, SPL token ownership, Token-2022, NFT mints, metadata accounts, PDAs, and local programs.
- Not ideal for transaction history, because history lives in the ledger. Transaction history should remain mocked through `getSignaturesForAddress` / `getTransaction`, unless a full persisted ledger snapshot is truly needed.

Ledger snapshots are possible by preserving a validator ledger directory, but they are bulkier, less reviewable, more validator-version sensitive, and should not be the default.

## Open Follow-Ups

- Add real account snapshot fixtures under `test/e2e/seeder/solana/network-states` once a concrete Solana token/NFT scenario needs exact mint addresses.
- Decide whether to fully migrate Solana specs from legacy `balanceSol` / `balanceLamports` to `accounts[].assets`.
- Longer term, move shared chain test assets into dedicated test-dapp packages where appropriate.
