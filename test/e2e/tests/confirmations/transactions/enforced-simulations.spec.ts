import { strict as assert } from 'assert';
import { DELEGATOR_CONTRACTS } from '@metamask/delegation-deployments';
import { MockttpServer } from 'mockttp';
import { Suite } from 'mocha';
import { parseTransaction } from 'viem';
import { Anvil } from '../../../seeder/anvil';
import { Driver } from '../../../webdriver/driver';
import { WINDOW_TITLES } from '../../../constants';
import FixtureBuilderV2 from '../../../fixtures/fixture-builder-v2';
import { withFixtures } from '../../../helpers';
import { login } from '../../../page-objects/flows/login.flow';
import { createDappTransaction } from '../../../page-objects/flows/transaction';
import TransactionConfirmation from '../../../page-objects/pages/confirmations/transaction-confirmation';
import { MockedEndpoint } from '../../../mock-e2e';
import { mockEip7702FeatureFlag } from '../helpers';
import { SECURITY_ALERTS_PROD_API_BASE_URL } from '../../ppom/constants';
import {
  SENDER_ADDRESS_MOCK,
  SENDER_ADDRESS_NO_0X_MOCK,
} from '../../simulation-details/types';
import { TX_SENTINEL_URL } from '../../../../../shared/constants/transaction';

const DAI_ADDRESS = '0x6b175474e89094c44da98b954eedeac495271d0f';
const USDC_ADDRESS = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48';
const RECIPIENT_ADDRESS = '0xe18035bf8712672935fdb4e5e431b1a0183d2dfc';
const RECIPIENT_NO_0X = RECIPIENT_ADDRESS.slice(2);
const ERC20_TRANSFER_TOPIC =
  '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';

const DAI_INCOMING_AMOUNT_HEX =
  '0000000000000000000000000000000000000000000000008ac7230489e80000';
const USDC_OUTGOING_AMOUNT_HEX =
  '00000000000000000000000000000000000000000000000000000000000f4240';

const TRANSACTION_MOCK = {
  data: '0x',
  from: SENDER_ADDRESS_MOCK,
  gas: '0x5208',
  maxFeePerGas: '0x2540BE400',
  maxPriorityFeePerGas: '0x3B9ACA00',
  to: RECIPIENT_ADDRESS,
  value: '0x38d7ea4c68000',
};

const SIMULATION_RESPONSE_MOCK = {
  jsonrpc: '2.0',
  result: {
    transactions: [
      {
        return: '0x',
        status: '0x1',
        gasUsed: '0x5208',
        gasLimit: '0x5208',
        fees: [
          {
            maxFeePerGas: '0x22ae4b8bcb',
            maxPriorityFeePerGas: '0x59682f04',
            balanceNeeded: '0xeaa6849ea3660',
            currentBalance: '0x2386f26fc1000000',
            error: '',
          },
        ],
        stateDiff: {
          post: {
            [SENDER_ADDRESS_MOCK]: {
              balance: '0x238364f11c398000',
              nonce: '0x1',
            },
            [RECIPIENT_ADDRESS]: {
              balance: '0x38d7ea4c68000',
            },
          },
          pre: {
            [SENDER_ADDRESS_MOCK]: {
              balance: '0x2386f26fc1000000',
            },
            [RECIPIENT_ADDRESS]: {
              balance: '0x0',
              nonce: '0x24',
            },
          },
        },
        callTrace: {
          from: SENDER_ADDRESS_MOCK,
          to: RECIPIENT_ADDRESS,
          type: 'CALL',
          gas: '0x1dcd6500',
          gasUsed: '0x5208',
          value: '0x38d7ea4c68000',
          input: '0x',
          output: '0x',
          error: '',
          calls: null,
          logs: [
            {
              address: DAI_ADDRESS,
              topics: [
                ERC20_TRANSFER_TOPIC,
                `0x000000000000000000000000${RECIPIENT_NO_0X}`,
                `0x000000000000000000000000${SENDER_ADDRESS_NO_0X_MOCK}`,
              ],
              data: `0x${DAI_INCOMING_AMOUNT_HEX}`,
            },
            {
              address: USDC_ADDRESS,
              topics: [
                ERC20_TRANSFER_TOPIC,
                `0x000000000000000000000000${SENDER_ADDRESS_NO_0X_MOCK}`,
                `0x000000000000000000000000${RECIPIENT_NO_0X}`,
              ],
              data: `0x${USDC_OUTGOING_AMOUNT_HEX}`,
            },
          ],
        },
        feeEstimate: 1954138800138000,
        baseFeePerGas: 92054228577,
      },
    ],
    blockNumber: '0x53afbb',
    id: '09156630-b754-4bb8-bfc4-3390d934cec6',
  },
  id: '42',
};

const DAI_PREV_BALANCE_HEX =
  '0000000000000000000000000000000000000000000000000000000000000000';
const USDC_PREV_BALANCE_HEX =
  '0000000000000000000000000000000000000000000000000000000000f4240a';
const BALANCE_SANDWICH_RESPONSE_MOCK = {
  jsonrpc: '2.0',
  result: {
    transactions: [
      {
        return: `0x${DAI_PREV_BALANCE_HEX}`,
        status: '0x1',
        gasUsed: '0x5de2',
        fees: [],
        feeEstimate: 0,
        baseFeePerGas: 0,
      },
      {
        return: `0x${USDC_PREV_BALANCE_HEX}`,
        status: '0x1',
        gasUsed: '0x5de2',
        fees: [],
        feeEstimate: 0,
        baseFeePerGas: 0,
      },
      {
        return: '0x',
        status: '0x1',
        gasUsed: '0x5208',
        fees: [],
        feeEstimate: 0,
        baseFeePerGas: 0,
      },
      {
        return: `0x${DAI_INCOMING_AMOUNT_HEX}`,
        status: '0x1',
        gasUsed: '0x5de2',
        fees: [],
        feeEstimate: 0,
        baseFeePerGas: 0,
      },
      {
        return:
          '0x0000000000000000000000000000000000000000000000000000000000000000',
        status: '0x1',
        gasUsed: '0x5de2',
        fees: [],
        feeEstimate: 0,
        baseFeePerGas: 0,
      },
    ],
    blockNumber: '0x53afbb',
    id: '1',
  },
  id: '1',
};

const REDEEM_DELEGATIONS_SELECTOR = '0xcef6d209';
const DELEGATION_MANAGER_ADDRESS =
  DELEGATOR_CONTRACTS['1.3.0']['1'].DelegationManager.toLowerCase();
const NATIVE_BALANCE_CHANGE_ENFORCER =
  DELEGATOR_CONTRACTS['1.3.0'][
    '1'
  ].NativeBalanceChangeEnforcer.toLowerCase().slice(2);
const ERC20_BALANCE_CHANGE_ENFORCER =
  DELEGATOR_CONTRACTS['1.3.0'][
    '1'
  ].ERC20BalanceChangeEnforcer.toLowerCase().slice(2);

async function mockTrustSignalsUntrusted(
  mockServer: MockttpServer,
): Promise<MockedEndpoint[]> {
  return [
    await mockServer
      .forPost(`${SECURITY_ALERTS_PROD_API_BASE_URL}/address/evm/scan`)
      .thenCallback(() => ({
        statusCode: 200,
        json: {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          result_type: 'Malicious',
          label: 'Known malicious address',
        },
      })),
  ];
}

async function mockTrustSignalsTrusted(
  mockServer: MockttpServer,
): Promise<MockedEndpoint[]> {
  return [
    await mockServer
      .forPost(`${SECURITY_ALERTS_PROD_API_BASE_URL}/address/evm/scan`)
      .thenCallback(() => ({
        statusCode: 200,
        json: {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          result_type: 'Trusted',
          label: 'Known safe address',
        },
      })),
  ];
}

async function mockTrustSignalsBenign(
  mockServer: MockttpServer,
): Promise<MockedEndpoint[]> {
  return [
    await mockServer
      .forPost(`${SECURITY_ALERTS_PROD_API_BASE_URL}/address/evm/scan`)
      .thenCallback(() => ({
        statusCode: 200,
        json: {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          result_type: 'Benign',
          label: 'No known issues',
        },
      })),
  ];
}

async function mockSimulationResponses(mockServer: MockttpServer) {
  await mockServer
    .forPost(TX_SENTINEL_URL)
    .withBodyIncluding('70a08231')
    .thenJson(200, BALANCE_SANDWICH_RESPONSE_MOCK);

  await mockServer
    .forPost(TX_SENTINEL_URL)
    .withBodyIncluding('infura_simulateTransactions')
    .thenJson(200, SIMULATION_RESPONSE_MOCK);
}

async function mockTransactionRelayNetworks(mockServer: MockttpServer) {
  await mockServer
    .forGet(`${TX_SENTINEL_URL}/networks`)
    .always()
    .thenCallback(() => ({
      ok: true,
      statusCode: 200,
      json: {
        '1': {
          network: 'ethereum-mainnet',
          confirmations: true,
          relayTransactions: true,
          sendBundle: true,
        },
      },
    }));
}

async function mockSmartTransactionFeatureFlags(mockServer: MockttpServer) {
  await mockServer
    .forGet('https://bridge.api.cx.metamask.io/featureFlags')
    .thenCallback(() => ({
      ok: true,
      statusCode: 200,
      json: {},
    }));
}

async function setupMocks(
  mockServer: MockttpServer,
): Promise<MockedEndpoint[]> {
  const eip7702Mocks = await mockEip7702FeatureFlag(mockServer);
  const trustSignalsMocks = await mockTrustSignalsUntrusted(mockServer);
  await mockSimulationResponses(mockServer);
  await mockTransactionRelayNetworks(mockServer);
  await mockSmartTransactionFeatureFlags(mockServer);
  return [...eip7702Mocks, ...trustSignalsMocks];
}

async function setupMocksTrustedRecipient(
  mockServer: MockttpServer,
): Promise<MockedEndpoint[]> {
  const eip7702Mocks = await mockEip7702FeatureFlag(mockServer);
  const trustSignalsMocks = await mockTrustSignalsTrusted(mockServer);
  await mockSimulationResponses(mockServer);
  await mockTransactionRelayNetworks(mockServer);
  await mockSmartTransactionFeatureFlags(mockServer);
  return [...eip7702Mocks, ...trustSignalsMocks];
}

async function setupMocksForDisableTest(
  mockServer: MockttpServer,
): Promise<MockedEndpoint[]> {
  const eip7702Mocks = await mockEip7702FeatureFlag(mockServer);
  const trustSignalsMocks = await mockTrustSignalsBenign(mockServer);
  await mockSimulationResponses(mockServer);
  await mockTransactionRelayNetworks(mockServer);
  await mockSmartTransactionFeatureFlags(mockServer);
  return [...eip7702Mocks, ...trustSignalsMocks];
}

const FAKE_TX_HASH =
  '0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef';

async function mockSendRawTransaction(
  mockServer: MockttpServer,
  capturedRawTxs: string[],
) {
  await mockServer
    .forPost()
    .withJsonBodyIncluding({ method: 'eth_sendRawTransaction' })
    .always()
    .thenCallback(async (req) => {
      const body = (await req.body.getJson()) as {
        params?: string[];
        id?: number;
      };

      if (body.params?.[0]) {
        capturedRawTxs.push(body.params[0]);
      }

      return {
        statusCode: 200,
        json: { jsonrpc: '2.0', id: body.id ?? 1, result: FAKE_TX_HASH },
      };
    });
}

async function confirmAndGetDecodedTransaction(
  driver: Driver,
  confirmation: TransactionConfirmation,
  capturedRawTxs: string[],
): Promise<ReturnType<typeof parseTransaction>> {
  await confirmation.clickFooterConfirmButton();

  await driver.switchToWindowWithTitle(WINDOW_TITLES.ExtensionInFullScreenView);

  for (let attempt = 0; attempt < 10; attempt++) {
    if (capturedRawTxs.length > 0) {
      break;
    }
    await driver.delay(1000);
  }

  if (capturedRawTxs.length === 0) {
    assert.fail(
      'No raw transaction captured from eth_sendRawTransaction within timeout',
    );
  }

  return parseTransaction(capturedRawTxs[0] as `0x${string}`);
}

describe('Enforced Simulations', function (this: Suite) {
  it('wraps a confirmed transaction with redeemDelegations and caveats for native and ERC20 balance changes', async function () {
    await withFixtures(
      {
        dappOptions: { numberOfTestDapps: 1 },
        fixtures: new FixtureBuilderV2()
          .withEnabledNetworks({ eip155: { '0x1': true } })
          .withPermissionControllerConnectedToTestDapp({ chainIds: [1] })
          .withSmartTransactionsOptedOut()
          .build(),
        localNodeOptions: {
          loadState:
            './test/e2e/seeder/network-states/eip7702-state/withUpgradedAccount.json',
        },
        testSpecificMock: setupMocks,
        title: this.test?.fullTitle(),
      },
      async ({
        driver,
        mockServer,
        localNodes,
      }: {
        driver: Driver;
        mockServer: MockttpServer;
        localNodes: Anvil[];
      }) => {
        const capturedRawTxs: string[] = [];
        await mockSendRawTransaction(mockServer, capturedRawTxs);

        await localNodes[0].setAccountBalance(
          SENDER_ADDRESS_MOCK as `0x${string}`,
          '0xDE0B6B3A7640000',
        );

        await login(driver, { expectedBalance: '1' });

        await createDappTransaction(driver, TRANSACTION_MOCK);
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        const confirmation = new TransactionConfirmation(driver);
        await confirmation.checkPageIsLoaded();

        await driver.waitForSelector(
          '[data-testid="enforced-simulations-row"]',
        );

        await driver.delay(2000);

        const decoded = await confirmAndGetDecodedTransaction(
          driver,
          confirmation,
          capturedRawTxs,
        );

        assert.strictEqual(
          decoded.to?.toLowerCase(),
          DELEGATION_MANAGER_ADDRESS,
          `Expected tx.to to be DelegationManager (${DELEGATION_MANAGER_ADDRESS}), got ${decoded.to}`,
        );

        assert.ok(
          decoded.value === 0n || decoded.value === undefined,
          `Expected tx.value to be 0 after wrapping, got ${decoded.value}`,
        );

        const dataHex = decoded.data ?? '0x';

        assert.ok(
          dataHex.startsWith(REDEEM_DELEGATIONS_SELECTOR),
          `Expected tx.data to start with redeemDelegations selector (${REDEEM_DELEGATIONS_SELECTOR}), got ${dataHex.slice(0, 10)}`,
        );

        const dataLower = dataHex.toLowerCase();

        assert.ok(
          dataLower.includes(NATIVE_BALANCE_CHANGE_ENFORCER),
          `Expected tx.data to contain NativeBalanceChangeEnforcer (${NATIVE_BALANCE_CHANGE_ENFORCER})`,
        );

        assert.ok(
          dataLower.includes(ERC20_BALANCE_CHANGE_ENFORCER),
          `Expected tx.data to contain ERC20BalanceChangeEnforcer (${ERC20_BALANCE_CHANGE_ENFORCER})`,
        );

        assert.ok(
          dataLower.includes(DAI_ADDRESS.slice(2).toLowerCase()),
          `Expected tx.data to reference DAI token address (${DAI_ADDRESS})`,
        );

        assert.ok(
          dataLower.includes(USDC_ADDRESS.slice(2).toLowerCase()),
          `Expected tx.data to reference USDC token address (${USDC_ADDRESS})`,
        );
      },
    );
  });

  it('does not wrap the transaction when the recipient is trusted', async function () {
    await withFixtures(
      {
        dappOptions: { numberOfTestDapps: 1 },
        fixtures: new FixtureBuilderV2()
          .withEnabledNetworks({ eip155: { '0x1': true } })
          .withPermissionControllerConnectedToTestDapp({ chainIds: [1] })
          .withSmartTransactionsOptedOut()
          .build(),
        localNodeOptions: {
          loadState:
            './test/e2e/seeder/network-states/eip7702-state/withUpgradedAccount.json',
        },
        testSpecificMock: setupMocksTrustedRecipient,
        title: this.test?.fullTitle(),
      },
      async ({
        driver,
        mockServer,
        localNodes,
      }: {
        driver: Driver;
        mockServer: MockttpServer;
        localNodes: Anvil[];
      }) => {
        const capturedRawTxs: string[] = [];
        await mockSendRawTransaction(mockServer, capturedRawTxs);

        await localNodes[0].setAccountBalance(
          SENDER_ADDRESS_MOCK as `0x${string}`,
          '0xDE0B6B3A7640000',
        );

        await login(driver, { expectedBalance: '1' });

        await createDappTransaction(driver, TRANSACTION_MOCK);
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        const confirmation = new TransactionConfirmation(driver);
        await confirmation.checkPageIsLoaded();

        await driver.delay(2000);

        const decoded = await confirmAndGetDecodedTransaction(
          driver,
          confirmation,
          capturedRawTxs,
        );

        assert.strictEqual(
          decoded.to?.toLowerCase(),
          RECIPIENT_ADDRESS.toLowerCase(),
          `Expected tx.to to remain as original recipient (${RECIPIENT_ADDRESS}), got ${decoded.to}`,
        );

        assert.strictEqual(
          decoded.data ?? '0x',
          '0x',
          `Expected tx.data to remain as original (0x), got ${(decoded.data ?? '0x').slice(0, 20)}`,
        );

        assert.strictEqual(
          decoded.value,
          BigInt(TRANSACTION_MOCK.value),
          `Expected tx.value to remain as original (${TRANSACTION_MOCK.value}), got ${decoded.value}`,
        );
      },
    );
  });

  it('auto-upgrades to type-4 (setCode) when account is not yet delegated', async function () {
    await withFixtures(
      {
        dappOptions: { numberOfTestDapps: 1 },
        fixtures: new FixtureBuilderV2()
          .withEnabledNetworks({ eip155: { '0x1': true } })
          .withPermissionControllerConnectedToTestDapp({ chainIds: [1] })
          .withSmartTransactionsOptedOut()
          .build(),
        localNodeOptions: {
          chainId: 1,
        },
        testSpecificMock: setupMocks,
        title: this.test?.fullTitle(),
      },
      async ({
        driver,
        mockServer,
      }: {
        driver: Driver;
        mockServer: MockttpServer;
      }) => {
        const capturedRawTxs: string[] = [];
        await mockSendRawTransaction(mockServer, capturedRawTxs);

        await login(driver);

        await createDappTransaction(driver, TRANSACTION_MOCK);
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        const confirmation = new TransactionConfirmation(driver);
        await confirmation.checkPageIsLoaded();

        await driver.waitForSelector(
          '[data-testid="enforced-simulations-row"]',
        );

        await driver.delay(2000);

        const decoded = await confirmAndGetDecodedTransaction(
          driver,
          confirmation,
          capturedRawTxs,
        );

        assert.strictEqual(
          decoded.type,
          'eip7702',
          `Expected tx type eip7702, got ${decoded.type}`,
        );

        const authList =
          'authorizationList' in decoded
            ? (decoded.authorizationList as readonly unknown[])
            : [];

        assert.ok(authList.length > 0, `Expected non-empty authorizationList`);

        const dataHex = decoded.data ?? '0x';

        assert.ok(
          dataHex.startsWith(REDEEM_DELEGATIONS_SELECTOR),
          `Expected tx.data to start with redeemDelegations selector (${REDEEM_DELEGATIONS_SELECTOR}), got ${dataHex.slice(0, 10)}`,
        );

        assert.strictEqual(
          decoded.to?.toLowerCase(),
          DELEGATION_MANAGER_ADDRESS,
          `Expected tx.to to be DelegationManager (${DELEGATION_MANAGER_ADDRESS}), got ${decoded.to}`,
        );
      },
    );
  });

  it('does not wrap the transaction when user disables enforcement', async function () {
    await withFixtures(
      {
        dappOptions: { numberOfTestDapps: 1 },
        fixtures: new FixtureBuilderV2()
          .withEnabledNetworks({ eip155: { '0x1': true } })
          .withPermissionControllerConnectedToTestDapp({ chainIds: [1] })
          .withSmartTransactionsOptedOut()
          .build(),
        localNodeOptions: {
          loadState:
            './test/e2e/seeder/network-states/eip7702-state/withUpgradedAccount.json',
        },
        testSpecificMock: setupMocksForDisableTest,
        title: this.test?.fullTitle(),
      },
      async ({
        driver,
        mockServer,
        localNodes,
      }: {
        driver: Driver;
        mockServer: MockttpServer;
        localNodes: Anvil[];
      }) => {
        const capturedRawTxs: string[] = [];
        await mockSendRawTransaction(mockServer, capturedRawTxs);

        await localNodes[0].setAccountBalance(
          SENDER_ADDRESS_MOCK as `0x${string}`,
          '0xDE0B6B3A7640000',
        );

        await login(driver, { expectedBalance: '1' });

        await createDappTransaction(driver, TRANSACTION_MOCK);
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        const confirmation = new TransactionConfirmation(driver);
        await confirmation.checkPageIsLoaded();

        await driver.waitForSelector(
          '[data-testid="enforced-simulations-row"]',
        );

        await driver.waitForSelector(
          '[data-testid="enforced-simulations-toggle"]',
        );

        await driver.clickElement(
          '[data-testid="enforced-simulations-toggle"]',
        );

        await driver.delay(3000);

        const decoded = await confirmAndGetDecodedTransaction(
          driver,
          confirmation,
          capturedRawTxs,
        );

        assert.strictEqual(
          decoded.to?.toLowerCase(),
          RECIPIENT_ADDRESS.toLowerCase(),
          `Expected tx.to to remain as original recipient (${RECIPIENT_ADDRESS}), got ${decoded.to}`,
        );

        assert.strictEqual(
          decoded.data ?? '0x',
          '0x',
          `Expected tx.data to remain as original (0x), got ${(decoded.data ?? '0x').slice(0, 20)}`,
        );

        assert.strictEqual(
          decoded.value,
          BigInt(TRANSACTION_MOCK.value),
          `Expected tx.value to remain as original (${TRANSACTION_MOCK.value}), got ${decoded.value}`,
        );
      },
    );
  });
});
