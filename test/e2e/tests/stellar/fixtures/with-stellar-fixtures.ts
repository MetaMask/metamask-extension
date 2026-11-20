import { MockedEndpoint, Mockttp } from 'mockttp';
import FixtureBuilderV2 from '../../../fixtures/fixture-builder-v2';
import { withFixtures } from '../../../helpers';
import { DEFAULT_STELLAR_ADDRESS } from '../../../constants';
import {
  mockStellarApis,
  type MockStellarApisOptions,
  type StellarAccountTransactionFixture,
} from '../mocks/common-stellar';

type WithFixturesOptions = Parameters<typeof withFixtures>[0];
type WithFixturesTestSuite = Parameters<typeof withFixtures>[1];

export type StellarFixtureAccount = {
  address?: string;
  horizonTransactions?: StellarAccountTransactionFixture['records'];
};

/**
 * Console noise from EVM RPC while on Stellar (no Anvil / Infura). Same idea as
 * Tron derivation's `includeAnvil: false` + `ignoredConsoleErrors`.
 */
const DEFAULT_STELLAR_IGNORED_CONSOLE_ERRORS = [
  'Failed to get nonce',
  'JsonRpcError: Failed to fetch',
];

export type WithStellarFixturesOptions = Omit<
  WithFixturesOptions,
  'localNodeOptions' | 'testSpecificMock'
> & {
  accounts?: StellarFixtureAccount[];
  fixtures?: unknown;
  horizonOptions?: Omit<MockStellarApisOptions, 'transactions'>;
  ignoredConsoleErrors?: string[];
  testSpecificMock?: (
    mockServer: Mockttp,
  ) => Promise<MockedEndpoint[] | MockedEndpoint>;
  title?: string;
};

/**
 * Runs a Stellar E2E suite with shared fixture options and Horizon mocks.
 *
 * @param options - Fixture / mock options.
 * @param testSuite - Test body.
 */
export async function withStellarFixtures(
  options: WithStellarFixturesOptions,
  testSuite: WithFixturesTestSuite,
): Promise<void> {
  const {
    accounts = [{ address: DEFAULT_STELLAR_ADDRESS }],
    fixtures = new FixtureBuilderV2().build(),
    horizonOptions = {},
    ignoredConsoleErrors,
    testSpecificMock,
    ...withFixtureOptions
  } = options;

  const transactions: StellarAccountTransactionFixture[] = accounts.map(
    (account) => ({
      address: account.address ?? DEFAULT_STELLAR_ADDRESS,
      records: account.horizonTransactions ?? [],
    }),
  );

  await withFixtures(
    {
      ...withFixtureOptions,
      fixtures,
      ignoredConsoleErrors: [
        ...DEFAULT_STELLAR_IGNORED_CONSOLE_ERRORS,
        ...(ignoredConsoleErrors ?? []),
      ],
      localNodeOptions: 'none',
      testSpecificMock: async (mockServer: Mockttp) => {
        // Custom endpoints first: mockttp's first matching `.always()` rule
        // wins, so a test override of a Stellar default URL must precede
        // `mockStellarApis` (same order as `withTronFixtures`).
        const customEndpoints = testSpecificMock
          ? await testSpecificMock(mockServer)
          : [];
        const stellarMocks = await mockStellarApis(mockServer, {
          ...horizonOptions,
          transactions,
        });
        return [
          ...(Array.isArray(customEndpoints)
            ? customEndpoints
            : [customEndpoints]),
          ...stellarMocks,
        ];
      },
    },
    testSuite,
  );
}
