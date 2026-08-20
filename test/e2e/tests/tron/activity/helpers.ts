import { createDeferredPromise } from '@metamask/utils';
import { Mockttp } from 'mockttp';
import { DEFAULT_FIXTURE_ACCOUNT } from '../../../constants';
import FixtureBuilderV2 from '../../../fixtures/fixture-builder-v2';
import { TronNode } from '../../../seeder/tron/node';
import { Driver } from '../../../webdriver/driver';
import { TRON_PORTFOLIO_ACCOUNT } from '../fixtures/environments';
import {
  withTronFixtures,
  type TronFixtureAccount,
} from '../fixtures/with-tron-fixtures';

export const A_RECIPIENT = 'TBEPnZeEVRJWtJwqY4f3VWEtf9jKyQ4HAu';
export const A_SENDER = 'TPwezUWpEGmFBENNWJHwXHRG1D2NCEEt5s';
export const A_SPENDER = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t';

export const TRON_ACTIVITY_ACCOUNTS: TronFixtureAccount[] = [
  TRON_PORTFOLIO_ACCOUNT,
];

const EVM_ACTIVITY_TRANSACTION = {
  hash: '0x1000000000000000000000000000000000000000000000000000000000000001',
  timestamp: new Date(1_234).toISOString(),
  chainId: 1337,
  blockNumber: 1,
  blockHash: '0x2',
  gas: 1,
  gasUsed: 1,
  gasPrice: '1',
  effectiveGasPrice: '1',
  nonce: 1,
  cumulativeGasUsed: 1,
  methodId: null,
  value: '4560000000000000000',
  to: '0x2',
  from: DEFAULT_FIXTURE_ACCOUNT.toLowerCase(),
  isError: false,
  valueTransfers: [
    {
      from: DEFAULT_FIXTURE_ACCOUNT.toLowerCase(),
      to: '0x2',
      amount: '4560000000000000000',
      decimal: 18,
      symbol: 'ETH',
    },
  ],
  logs: [],
  transactionCategory: 'STANDARD',
  transactionType: 'STANDARD',
  readable: 'Send',
};

export async function mockAccountsApiWithEvmActivity(mockServer: Mockttp) {
  return [
    await mockServer
      .forGet(
        'https://accounts.api.cx.metamask.io/v4/multiaccount/transactions',
      )
      .always()
      .thenCallback((request) => {
        const url = new URL(request.url);
        const networksParam = url.searchParams.get('networks') ?? '';
        const evmNetworks = networksParam
          .split(',')
          .filter((network) => network.startsWith('eip155:'));

        return {
          statusCode: 200,
          json: {
            data: evmNetworks.length > 0 ? [EVM_ACTIVITY_TRANSACTION] : [],
            pageInfo: {
              hasNextPage: false,
              count: evmNetworks.length > 0 ? 1 : 0,
            },
          },
        };
      }),
  ];
}

export async function withTronActivityFixtures(
  options: {
    borrowedTronNode: TronNode;
    title?: string;
    transactions?: TronFixtureAccount['transactions'];
    testSpecificMock?: (
      mockServer: Mockttp,
    ) => ReturnType<typeof mockAccountsApiWithEvmActivity>;
  },
  testFn: (driver: Driver) => Promise<void>,
): Promise<void> {
  await withTronFixtures(
    {
      accounts: [
        {
          ...TRON_PORTFOLIO_ACCOUNT,
          ...(options.transactions
            ? { transactions: options.transactions }
            : {}),
        },
      ],
      borrowedTronNode: options.borrowedTronNode,
      fixtures: new FixtureBuilderV2().build(),
      includeAnvil: false,
      testSpecificMock: options.testSpecificMock,
      title: options.title,
    },
    async ({ driver }: { driver: Driver }) => {
      await testFn(driver);
    },
  );
}

/**
 * Holds one `withFixtures` Chrome session open for every test in a Mocha
 * suite. Matches the phishing-redirects pattern: `start()` resolves the
 * driver, then waits until `stop()` so cleanup still runs through
 * `withFixtures`.
 *
 * @param options - Fixture options shared by every case in the suite
 * @returns Session controls for the suite `before` / `after` hooks
 */
export function createSharedTronActivitySession(
  options: Omit<Parameters<typeof withTronActivityFixtures>[0], 'title'>,
) {
  const deferredSuite = createDeferredPromise<void>();
  let fixturePromise: Promise<void> | undefined;

  return {
    async start(title?: string): Promise<Driver> {
      const driverReady = createDeferredPromise<Driver>();
      fixturePromise = withTronActivityFixtures(
        { ...options, title },
        async (driver) => {
          driverReady.resolve(driver);
          await deferredSuite.promise;
        },
      ).catch((error: unknown) => {
        driverReady.reject(error);
        throw error;
      });
      return driverReady.promise;
    },
    async stop(): Promise<void> {
      deferredSuite.resolve();
      await fixturePromise;
    },
  };
}
