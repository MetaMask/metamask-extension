import { MockttpServer } from 'mockttp';

const CONTRACT_ADDRESS = {
  BalanceCheckerEthereumMainnet: '0xb1f8e55c7f64d203c1400b9d8555d050f94adf39',
  BalanceCheckerLineaMainnet: '0xf62e6a41561b3650a69bb03199c735e3e3328c0d',
};

const infuraUrl: string =
  'https://mainnet.infura.io/v3/00000000000000000000000000000000';
const infuraLineaMainnetUrl: string =
  'https://linea-mainnet.infura.io/v3/00000000000000000000000000000000';
const infuraLineaSepoliaUrl: string =
  'https://linea-sepolia.infura.io/v3/00000000000000000000000000000000';
const infuraSepoliaUrl: string =
  'https://sepolia.infura.io/v3/00000000000000000000000000000000';

/**
 * Mocks multi network balance polling requests.
 *
 * @param mockServer - The mock server instance to set up the mocks on.
 * @returns A promise that resolves when all mocks have been set up.
 */
export async function mockMultiNetworkBalancePolling(
  mockServer: MockttpServer,
): Promise<void> {
  await mockServer
    .forPost(infuraUrl)
    .withJsonBodyIncluding({ method: 'eth_getBalance' })
    .thenCallback(() => ({
      statusCode: 200,
      json: {
        jsonrpc: '2.0',
        id: '1111111111111111',
        result: '0x1158E460913D00000',
      },
    }));

  await mockServer
    .forPost(infuraSepoliaUrl)
    .withJsonBodyIncluding({ method: 'eth_getBalance' })
    .thenCallback(() => ({
      statusCode: 200,
      json: {
        jsonrpc: '2.0',
        id: '6183194981233610',
        result: '0x1158E460913D00000',
      },
    }));

  await mockServer
    .forPost(infuraLineaMainnetUrl)
    .withJsonBodyIncluding({ method: 'eth_getBalance' })
    .thenCallback(() => ({
      statusCode: 200,
      json: {
        jsonrpc: '2.0',
        id: '6183194981233610',
        result: '0x1158E460913D00000',
      },
    }));

  await mockServer
    .forPost(infuraLineaSepoliaUrl)
    .withJsonBodyIncluding({ method: 'eth_getBalance' })
    .thenCallback(() => ({
      statusCode: 200,
      json: {
        jsonrpc: '2.0',
        id: '6183194981233610',
        result: '0x1158E460913D00000',
      },
    }));

  await mockServer
    .forPost(infuraUrl)
    .withJsonBodyIncluding({ method: 'net_version' })
    .thenCallback(() => ({
      statusCode: 200,
      json: {
        jsonrpc: '2.0',
        id: '6183194981233610',
        result: '0x1',
      },
    }));

  await mockServer
    .forPost(infuraLineaMainnetUrl)
    .withJsonBodyIncluding({ method: 'eth_call' })
    .thenCallback(() => ({
      statusCode: 200,
      json: {
        jsonrpc: '2.0',
        id: '1111111111111111',
        result:
          '0x0000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000a000000000000000000000000000000000000000000000001158E460913D000000000000000000000000000000000000000000000000000000001699651aa88200000000000000000000000000000000000000000000000000001beca58919dc0000000000000000000000000000000000000000000000000000974189179054f0000000000000000000000000000000000000000000000000001d9ae54845818000000000000000000000000000000000000000000000000000009184e72a00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000110d9316ec0000000000000000000000000000000000000000000000000000000000000000000',
      },
    }));

  await mockServer
    .forPost(infuraUrl)
    .withJsonBodyIncluding({
      method: 'eth_call',
      params: [
        {
          to: CONTRACT_ADDRESS.BalanceCheckerEthereumMainnet,
        },
      ],
    })
    .thenCallback(() => ({
      statusCode: 200,
      json: {
        jsonrpc: '2.0',
        id: '6183194981233610',
        result:
          '0x0000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000a000000000000000000000000000000000000000000000001158E460913D000000000000000000000000000000000000000000000000000000001699651aa88200000000000000000000000000000000000000000000000000001beca58919dc0000000000000000000000000000000000000000000000000000974189179054f0000000000000000000000000000000000000000000000000001d9ae54845818000000000000000000000000000000000000000000000000000009184e72a00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000110d9316ec0000000000000000000000000000000000000000000000000000000000000000000',
      },
    }));

  await mockServer
    .forGet(
      'https://accounts.api.cx.metamask.io/v2/accounts/0x5cfe73b6021e818b776b421b1c4db2474086a7e1/balances',
    )
    .withQuery({
      networks: 1,
    })
    .thenCallback(() => ({
      statusCode: 200,
      json: {
        count: 0,
        balances: [
          {
            object: 'token',
            address: '0x0000000000000000000000000000000000000000',
            symbol: 'ETH',
            name: 'Ether',
            type: 'native',
            timestamp: '2015-07-30T03:26:13.000Z',
            decimals: 18,
            chainId: 1,
            balance: '20',
          },
        ],
        unprocessedNetworks: [],
      },
    }));
}
