import { MockedEndpoint, Mockttp } from 'mockttp';
import { withFixtures } from '../../../helpers';
import {
  STELLAR_ACCOUNT_ADDRESS,
  buildStellarFixture,
  mockStellarApis,
  type MockStellarApisOptions,
  type StellarAccountTransactionFixture,
} from '../mocks/common-stellar';
import {
  createStellarSubmittedTxStore,
  getSubmittedHorizonRecordsForAccount,
  mockStellarSendNetwork,
} from '../mocks/stellar-send-mocks';

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
  horizonOptions?: Omit<
    MockStellarApisOptions,
    'transactions' | 'getExtraTransactionRecords'
  >;
  /**
   * When true, mocks Soroban RPC submit + Horizon fee/tx endpoints so Send can
   * progress Pending → Confirmed without a live Stellar node.
   */
  enableSend?: boolean;
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
    accounts = [{ address: STELLAR_ACCOUNT_ADDRESS }],
    fixtures = buildStellarFixture().build(),
    horizonOptions = {},
    enableSend = false,
    ignoredConsoleErrors,
    testSpecificMock,
    ...withFixtureOptions
  } = options;

  const transactions: StellarAccountTransactionFixture[] = accounts.map(
    (account) => ({
      address: account.address ?? STELLAR_ACCOUNT_ADDRESS,
      records: account.horizonTransactions ?? [],
    }),
  );

  const submittedTxStore = enableSend
    ? createStellarSubmittedTxStore()
    : undefined;

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
        const stellarMocks = await mockStellarApis(mockServer, {
          ...horizonOptions,
          transactions,
          getExtraTransactionRecords: submittedTxStore
            ? (address) =>
                getSubmittedHorizonRecordsForAccount(submittedTxStore, address)
            : undefined,
        });
        const sendMocks = submittedTxStore
          ? await mockStellarSendNetwork(mockServer, submittedTxStore)
          : [];
        const extra = testSpecificMock
          ? await testSpecificMock(mockServer)
          : [];
        return [
          ...stellarMocks,
          ...sendMocks,
          ...(Array.isArray(extra) ? extra : [extra]),
        ];
      },
    },
    testSuite,
  );
}
