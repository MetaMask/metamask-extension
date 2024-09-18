import {
  createPublicClient,
  createTestClient,
  createWalletClient,
  http,
} from 'viem';

const anvil = {
  id: 1337,
  name: 'Localhost',
  nativeCurrency: {
    decimals: 18,
    name: 'Ether',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: {
      http: ['http://127.0.0.1:8545'],
      webSocket: ['ws://127.0.0.1:8545'],
    },
  },
};

type Instance = {
  host: string;
  port: number;
};

function createAnvilClients(instance: Instance) {
  const publicClient = createPublicClient({
    chain: anvil,
    transport: http(`http://${instance.host}:${instance.port}`),
  });

  const testClient = createTestClient({
    chain: anvil,
    mode: 'anvil',
    transport: http(`http://${instance.host}:${instance.port}`),
  });

  const walletClient = createWalletClient({
    chain: anvil,
    transport: http(`http://${instance.host}:${instance.port}`),
  });

  return { publicClient, testClient, walletClient };
}

export { createAnvilClients };
