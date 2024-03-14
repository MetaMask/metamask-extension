const { createPublicClient, createTestClient, createWalletClient, http } = require("viem");
const { mainnet } = require("viem/chains")

const anvil = {
  ...mainnet, // We are using a mainnet fork for testing.
  id: 123, // We configured our anvil instance to use `123` as the chain id (see `globalSetup.ts`);
  rpcUrls: {
    // These rpc urls are automatically used in the transports.
    default: {
      // Note how we append the worker id to the local rpc urls.
      http: [`http://127.0.0.1:8545/1`],
      webSocket: [`ws://127.0.0.1:8545/1`],
    },
    public: {
      // Note how we append the worker id to the local rpc urls.
      http: [`http://127.0.0.1:8545/1`],
      webSocket: [`ws://127.0.0.1:8545/1`],
    },
  },
}

function createAnvilClients(instance) {
  const publicClient = createPublicClient({
    chain: anvil,
    transport: http(`http://${instance.host}:${instance.port}`),
  });

  const testClient = createTestClient({
    chain: anvil,
    mode: "anvil",
    transport: http(`http://${instance.host}:${instance.port}`),
  });

  const walletClient = createWalletClient({
    chain: anvil,
    transport: http(`http://${instance.host}:${instance.port}`),
  });

  return { publicClient, testClient, walletClient };
}

module.exports = createAnvilClients;