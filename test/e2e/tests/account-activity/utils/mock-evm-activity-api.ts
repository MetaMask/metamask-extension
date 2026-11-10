import type { MockedEndpoint, Mockttp } from 'mockttp';
import type { V5TransactionRecord } from '@metamask/core-backend';
import {
  DEFAULT_FIXTURE_ACCOUNT_LOWERCASE,
  ACCOUNT_2,
} from '../../../constants';

const BASE_TIMESTAMP = Date.now();

const evmChainId = 1337;

/** A confirmed native ETH send returned by the accounts activity API. */
const evmSendRecord: V5TransactionRecord = {
  accountId: `eip155:0:${DEFAULT_FIXTURE_ACCOUNT_LOWERCASE}`,
  tx: {
    id: `0x${'cd'.repeat(32)}`,
    chainId: `eip155:${evmChainId}`,
    status: 'confirmed',
    timestamp: BASE_TIMESTAMP - 300_000,
    date: new Date(BASE_TIMESTAMP - 300_000).toISOString(),
    from: DEFAULT_FIXTURE_ACCOUNT_LOWERCASE,
    to: ACCOUNT_2.toLowerCase(),
    blockNumber: '100',
    blockHash: `0x${'ef'.repeat(32)}`,
    value: '1000000000000000000',
    transactionCategory: 'TRANSFER',
  },
  valueTransfers: [
    {
      assetClass: 'ft',
      from: DEFAULT_FIXTURE_ACCOUNT_LOWERCASE,
      to: ACCOUNT_2.toLowerCase(),
      assetId: `eip155:${evmChainId}/slip44:60`,
      amount: '1000000000000000000',
      decimal: 18,
      symbol: 'ETH',
      name: 'Ether',
    },
  ],
  fee: null,
};

/**
 * Serves an EVM send from the accounts activity API only when the request
 * covers EVM networks. Under a non-EVM-only filter (Tron, Solana, …) the UI
 * never queries EVM networks, so the mocked transaction stays hidden.
 *
 * @param mockServer - The Mockttp server instance.
 */
export async function mockEvmActivityApi(
  mockServer: Mockttp,
): Promise<MockedEndpoint[]> {
  return [
    await mockServer
      .forGet(
        /https:\/\/accounts\.api\.cx\.metamask\.io\/v5\/multiaccount\/transactions/u,
      )
      .always()
      .thenCallback((request) => {
        const networks = new URL(request.url).searchParams
          .getAll('networks')
          .flatMap((value) => value.split(','));
        const data = networks.some((network) => network.startsWith('eip155:'))
          ? [evmSendRecord]
          : [];
        return {
          statusCode: 200,
          json: {
            unprocessedAccounts: [],
            pageInfo: { count: data.length, hasNextPage: false },
            data,
          },
        };
      }),
  ];
}
