import type { MockedEndpoint, Mockttp } from 'mockttp';
import {
  DEFAULT_FIXTURE_ACCOUNT_LOWERCASE,
  ACCOUNT_2,
} from '../../../../constants';

const BASE_TIMESTAMP = Date.now();

/** A confirmed native ETH send returned by the accounts activity API. */
const EVM_SEND_TX = {
  hash: `0x${'cd'.repeat(32)}`,
  timestamp: new Date(BASE_TIMESTAMP - 300_000).toISOString(),
  chainId: 1337,
  blockNumber: 100,
  blockHash: `0x${'ef'.repeat(32)}`,
  gas: 21_000,
  gasUsed: 21_000,
  gasPrice: '1000000000',
  effectiveGasPrice: '1000000000',
  nonce: 0,
  cumulativeGasUsed: 21_000,
  value: '1000000000000000000',
  from: DEFAULT_FIXTURE_ACCOUNT_LOWERCASE,
  to: ACCOUNT_2.toLowerCase(),
  isError: false,
  transactionCategory: 'TRANSFER',
  valueTransfers: [
    {
      from: DEFAULT_FIXTURE_ACCOUNT_LOWERCASE,
      to: ACCOUNT_2.toLowerCase(),
      amount: '1000000000000000000',
      decimal: 18,
      symbol: 'ETH',
      name: 'Ether',
      transferType: 'normal',
    },
  ],
};

/**
 * Serves an EVM send from the accounts activity API only when the request
 * covers EVM networks. Under the Tron-only filter the UI never queries EVM
 * networks, so the mocked transaction stays hidden.
 *
 * @param mockServer - The Mockttp server instance.
 */
export async function mockEvmActivityApi(
  mockServer: Mockttp,
): Promise<MockedEndpoint[]> {
  return [
    await mockServer
      .forGet(
        /https:\/\/accounts\.api\.cx\.metamask\.io\/v4\/multiaccount\/transactions/u,
      )
      .always()
      .thenCallback((request) => {
        const networks = new URL(request.url).searchParams
          .getAll('networks')
          .flatMap((value) => value.split(','));
        const data = networks.some((network) => network.startsWith('eip155:'))
          ? [EVM_SEND_TX]
          : [];
        return {
          statusCode: 200,
          json: {
            unprocessedNetworks: [],
            pageInfo: { count: data.length, hasNextPage: false },
            data,
          },
        };
      }),
  ];
}
