# EIP4337 reference modules

## Bundler

A basic eip4337 "bundler"

This is a reference implementation for a bundler, implementing the full EIP-4337
RPC calls (both production and debug calls), required to pass the [bundler-spec-tests](https://github.com/eth-infinitism/bundler-spec-tests) test suite.

### Running local node
In order to implement the full spec storage access rules and opcode banning, it must run
against a GETH node, which supports debug_traceCall with javascript "tracer"
Specifically, `hardhat node` and `ganache` do NOT support this API.
You can still run the bundler with such nodes, but with `--unsafe` so it would skip these security checks

If you don't have geth installed locally, you can use docker to run it:
```
docker run --rm -ti --name geth -p 8545:8545 ethereum/client-go:v1.10.26 \
  --miner.gaslimit 12000000 \
  --http --http.api personal,eth,net,web3,debug \
  --http.vhosts '*,localhost,host.docker.internal' --http.addr "0.0.0.0" \
  --ignore-legacy-receipts --allow-insecure-unlock --rpc.allow-unprotected-txs \
  --dev \
  --verbosity 2 \
  --nodiscover --maxpeers 0 --mine --miner.threads 1 \
  --networkid 1337
```

### Usage: 
1. run `yarn && yarn preprocess`
2. deploy contracts with `yarn hardhat-deploy --network localhost`
3. run `yarn run bundler`
    (or `yarn run bundler --unsafe`, if working with "hardhat node")

Now your bundler is active on local url http://localhost:3000/rpc    

To run a simple test, do `yarn run runop --deployFactory --network http://localhost:8545/ --entryPoint 0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789`

   The runop script:
   - deploys a wallet deployer (if not already there)
   - creates a random signer (owner for wallet)
   - determines the wallet address, and funds it
   - sends a transaction (which also creates the wallet)
   - sends another transaction, on this existing wallet
   - (uses account[0] or mnemonic file for funding, and creating deployer if needed)


NOTE: if running on a testnet, you need to supply the bundler (and runop) the network and mnemonic file, e.g.

`yarn run bundler --network localhost --mnemonic file.txt` 

To run the full test bundler spec test suite, visit https://github.com/eth-infinitism/bundler-spec-tests

## sdk

SDK to create and send UserOperations
see [SDK Readme](./packages/sdk/README.md)

## utils

internal utility methods/test contracts, used by other packages.
