# MetaMask Test Bundler

An EIP-4337 bundler used in MetaMask client E2E tests.

> [!NOTE]
> Forked from [eth-infinitism/bundler](https://github.com/eth-infinitism/bundler).

## Usage

### Start Server

```typescript
import { startBundler, BundlerServer } from '@metamask/test-bundler';

const server = await startBundler({
  configFile: './some-directory/bundler.config.json',
  unsafe: true, // Disable extra validations requiring RPC debug methods.
});
```

The server is accessible at `http://localhost:3000/rpc` by default.

### Stop Server

```typescript
await server.stop();
```

## Configuration

The server is primarily configured using a JSON file:

```javascript
{
  // Delay in seconds before submitting any pending user operations in a transaction.
  "autoBundleInterval": 3,
  // Max number of user operations in a single transaction.
  "autoBundleMempoolSize": 10,
  // Account to be compensated for the gas cost of the transaction.
  "beneficiary": "0x8890d2dAB1922Bec92922f7E6879D5c65ba333f4",
  // Address of the entrypoint smart contract.
  "entryPoint": "0x18b06605539dc02ecD3f7AB314e38eB7c1dA5c9b",
  // Max total gas of user operations in a single transaction.
  "maxBundleGas": 5e6,
  // Minimum allowed balance of the signing account.
  "minBalance": "0",
  // Path to a text file containing the mnemonic for the account signing the transactions.
  "mnemonic": "./test/e2e/bundler.mnemonic.txt",
  // URL of an RPC provider for the desired network.
  "network": "http://127.0.0.1:8545",
  // Local port to run the server on.
  "port": "3000"
}
```

## Build

```shell
# Install dependencies.
yarn

# 1. Compile smart contracts using Hardhat.
# 2. Compile typescript sources to `dist` folder.
yarn setup
```

## Test

Run the unit tests using Hardhat:

```
yarn test
```
