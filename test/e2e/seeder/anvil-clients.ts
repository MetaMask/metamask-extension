import {
  createPublicClient,
  createTestClient,
  createWalletClient,
  http,
} from 'viem';
import { anvil as baseAnvil } from 'viem/chains';

type Instance = {
  host: string;
  port: number;
};

function createAnvilClients(instance: Instance, id: number, port: number) {
  const anvil = {
    ...baseAnvil,
    id,
    rpcUrls: {
      default: {
        http: [`http://${instance.host}:${port}/1`],
        webSocket: [`ws://${instance.host}:${port}/1`],
      },
    },
  };

  const publicClient = createPublicClient({
    chain: anvil,
    transport: http(`http://${instance.host}:${port}/1`),
  });

  const testClient = createTestClient({
    chain: anvil,
    mode: 'anvil',
    transport: http(`http://${instance.host}:${port}/1`),
  });

  const walletClient = createWalletClient({
    chain: anvil,
    transport: http(`http://${instance.host}:${port}/1`),
  });

  return { publicClient, testClient, walletClient };
}

export { createAnvilClients };
