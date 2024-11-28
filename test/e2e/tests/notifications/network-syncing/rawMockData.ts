import {
  NetworkConfiguration,
  RpcEndpointType,
} from '@metamask/network-controller';
import {
  Encryption,
  createSHA256Hash,
} from '@metamask/profile-sync-controller/sdk';
import { NOTIFICATIONS_TEAM_STORAGE_KEY } from '../constants';

export type RPCEndpoint = NetworkConfiguration['rpcEndpoints'][number];

export const createMockInfuraRPC = (): RPCEndpoint => ({
  type: RpcEndpointType.Infura,
  networkClientId: 'mainnet',
  url: `https://mainnet.infura.io/v3/{infuraProjectId}`,
});

export const createMockCustomRpcEndpoint = (
  override: Partial<Extract<RPCEndpoint, { type: RpcEndpointType.Custom }>>,
): RPCEndpoint => {
  return {
    type: RpcEndpointType.Custom,
    networkClientId: '1111-1111-1111',
    url: `https://FAKE_RPC/`,
    ...override,
  } as RPCEndpoint;
};

export const createMockNetworkConfiguration = (
  override?: Partial<NetworkConfiguration>,
): NetworkConfiguration => {
  return {
    chainId: '0x1337',
    blockExplorerUrls: ['https://etherscan.io'],
    defaultRpcEndpointIndex: 0,
    name: 'Mock Network',
    nativeCurrency: 'MOCK TOKEN',
    rpcEndpoints: [],
    defaultBlockExplorerUrlIndex: 0,
    ...override,
  };
};

// Run this to generate the `mockData.ts` data
const generateMockEncryptedData = async () => {
  const networkConfig1337 = createMockNetworkConfiguration({
    chainId: '0x1337',
    rpcEndpoints: [
      createMockCustomRpcEndpoint({
        networkClientId: '1',
        url: `https://FAKE_RPC_1/`,
      }),
      createMockCustomRpcEndpoint({
        networkClientId: '2',
        url: `https://FAKE_RPC_2/`,
      }),
    ],
    // you can pass a very large lastUpdatedAt if you want it to win
    // or you can pass a small number/0 for it to lose
    // or you can leave undefined if you want to test if remote does not have this field
    lastUpdatedAt: 9999999999999,
  });

  const encryptedData = await Encryption.encryptString(
    JSON.stringify(networkConfig1337),
    NOTIFICATIONS_TEAM_STORAGE_KEY,
  );
  const encryptedHash = createSHA256Hash(
    '0x1337' + NOTIFICATIONS_TEAM_STORAGE_KEY,
  );

  return {
    HashedKey: encryptedHash,
    Data: encryptedData,
  };
};
