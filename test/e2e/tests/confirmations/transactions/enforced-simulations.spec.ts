import { strict as assert } from 'assert';
import { DELEGATOR_CONTRACTS } from '@metamask/delegation-deployments';
import { MockttpServer } from 'mockttp';
import { Suite } from 'mocha';
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
  SEND_ETH_REQUEST_MOCK,
  SEND_ETH_TRANSACTION_MOCK,
} from '../../simulation-details/mock-request-send-eth';
import { TX_SENTINEL_URL } from '../../../../../shared/constants/transaction';

const REDEEM_DELEGATIONS_SELECTOR = '0xcef6d209';
const DELEGATION_MANAGER_ADDRESS =
  DELEGATOR_CONTRACTS['1.3.0']['1'].DelegationManager.toLowerCase();
const NATIVE_BALANCE_CHANGE_ENFORCER =
  DELEGATOR_CONTRACTS['1.3.0'][
    '1'
  ].NativeBalanceChangeEnforcer.toLowerCase().slice(2);

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

async function mockSimulationResponse(mockServer: MockttpServer) {
  await mockServer
    .forPost(TX_SENTINEL_URL)
    .withBodyIncluding('infura_simulateTransactions')
    .thenJson(200, SEND_ETH_REQUEST_MOCK.response);
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
  await mockSimulationResponse(mockServer);
  await mockTransactionRelayNetworks(mockServer);
  await mockSmartTransactionFeatureFlags(mockServer);
  return [...eip7702Mocks, ...trustSignalsMocks];
}

describe('Enforced Simulations', function (this: Suite) {
  it('wraps a confirmed transaction with redeemDelegations and caveats', async function () {
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
      async ({ driver }: { driver: Driver }) => {
        await login(driver, { expectedBalance: '0' });

        await createDappTransaction(driver, SEND_ETH_TRANSACTION_MOCK);
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        const confirmation = new TransactionConfirmation(driver);
        await confirmation.checkPageIsLoaded();

        await driver.waitForSelector(
          '[data-testid="enforced-simulations-row"]',
        );

        await driver.delay(2000);

        const wrappedTx = (await driver.executeScript(`
          const state = await window.stateHooks.getCleanAppState();
          const txs = state?.metamask?.transactions || [];
          const tx = txs[txs.length - 1];
          return {
            to: tx?.txParams?.to,
            data: tx?.txParams?.data,
            value: tx?.txParams?.value,
            originalTo: tx?.txParamsOriginal?.to,
            containerTypes: tx?.containerTypes,
          };
        `)) as {
          to: string;
          data: string;
          value: string;
          originalTo: string;
          containerTypes: string[];
        };

        assert.ok(wrappedTx, 'No transaction found in state');

        assert.deepStrictEqual(
          wrappedTx.containerTypes,
          ['enforcedSimulations'],
          `Expected containerTypes to include enforcedSimulations, got ${JSON.stringify(wrappedTx.containerTypes)}`,
        );

        assert.strictEqual(
          wrappedTx.to?.toLowerCase(),
          DELEGATION_MANAGER_ADDRESS,
          `Expected tx.to to be DelegationManager (${DELEGATION_MANAGER_ADDRESS}), got ${wrappedTx.to}`,
        );

        assert.strictEqual(
          wrappedTx.value,
          '0x0',
          `Expected tx.value to be 0x0 after wrapping, got ${wrappedTx.value}`,
        );

        assert.ok(
          wrappedTx.data.startsWith(REDEEM_DELEGATIONS_SELECTOR),
          `Expected tx.data to start with redeemDelegations selector (${REDEEM_DELEGATIONS_SELECTOR}), got ${wrappedTx.data.slice(0, 10)}`,
        );

        assert.ok(
          wrappedTx.data.toLowerCase().includes(NATIVE_BALANCE_CHANGE_ENFORCER),
          `Expected tx.data to contain NativeBalanceChangeEnforcer address (${NATIVE_BALANCE_CHANGE_ENFORCER})`,
        );

        assert.strictEqual(
          wrappedTx.originalTo?.toLowerCase(),
          SEND_ETH_TRANSACTION_MOCK.to.toLowerCase(),
          `Expected txParamsOriginal.to to be preserved (${SEND_ETH_TRANSACTION_MOCK.to}), got ${wrappedTx.originalTo}`,
        );
      },
    );
  });
});
