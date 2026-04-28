import { strict as assert } from 'assert';
import { DELEGATOR_CONTRACTS } from '@metamask/delegation-deployments';
import { MockttpServer } from 'mockttp';
import { Suite } from 'mocha';
import { ResultType } from '../../../../../shared/lib/trust-signals';
import { Anvil } from '../../../seeder/anvil';
import { Driver } from '../../../webdriver/driver';
import { WINDOW_TITLES } from '../../../constants';
import FixtureBuilderV2 from '../../../fixtures/fixture-builder-v2';
import { withFixtures } from '../../../helpers';
import { login } from '../../../page-objects/flows/login.flow';
import { createDappTransaction } from '../../../page-objects/flows/transaction';
import TransactionConfirmation from '../../../page-objects/pages/confirmations/transaction-confirmation';
import ActivityListPage from '../../../page-objects/pages/home/activity-list';
import TestDappIndividualRequest from '../../../page-objects/pages/test-dapp-individual-request';
import { MockedEndpoint } from '../../../mock-e2e';
import { mockEip7702FeatureFlag } from '../helpers';
import { getTransactionDetails } from '../helpers/anvil-transaction';
import { mockSimulationApi } from '../mocks/simulation';
import { mockTrustSignal } from '../mocks/trust-signals';
import { SENDER_ADDRESS_MOCK } from '../../simulation-details/types';

const USDC_ADDRESS = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48';
const RECIPIENT_ADDRESS = '0xe18035bf8712672935fdb4e5e431b1a0183d2dfc';
const ERC20_TRANSFER_SELECTOR = '0xa9059cbb';
const REDEEM_DELEGATIONS_SELECTOR = '0xcef6d209';

const USDC_TRANSFER_AMOUNT_HEX = '0f4240';
const USDC_LARGE_TRANSFER_AMOUNT_HEX = '1e8480';
const USDC_SENDER_PRE_BALANCE_HEX = '3b9aca00';
const USDC_SENDER_POST_BALANCE_HEX = '3b8b87c0';

const USDC_TRANSFER_CALLDATA = `${ERC20_TRANSFER_SELECTOR}${'0'.repeat(24)}${RECIPIENT_ADDRESS.slice(2)}${USDC_TRANSFER_AMOUNT_HEX.padStart(64, '0')}`;
const USDC_LARGE_TRANSFER_CALLDATA = `${ERC20_TRANSFER_SELECTOR}${'0'.repeat(24)}${RECIPIENT_ADDRESS.slice(2)}${USDC_LARGE_TRANSFER_AMOUNT_HEX.padStart(64, '0')}`;

const TRANSACTION_MOCK = {
  data: USDC_TRANSFER_CALLDATA,
  from: SENDER_ADDRESS_MOCK,
  gas: '0x7A120',
  maxFeePerGas: '0x2540BE400',
  maxPriorityFeePerGas: '0x3B9ACA00',
  to: USDC_ADDRESS,
  value: '0x0',
};

const DELEGATION_MANAGER_ADDRESS =
  DELEGATOR_CONTRACTS['1.3.0']['1'].DelegationManager.toLowerCase();
const ERC20_BALANCE_CHANGE_ENFORCER =
  DELEGATOR_CONTRACTS['1.3.0'][
    '1'
  ].ERC20BalanceChangeEnforcer.toLowerCase().slice(2);

const ENFORCED_SIMULATIONS_LOAD_STATE =
  './test/e2e/seeder/network-states/eip7702-state/withEnforcedSimulationContracts.json';

describe('Enforced Simulations', function (this: Suite) {
  it('wraps the transaction so balance changes are enforced on-chain', async function () {
    await withFixtures(
      enforcedSimulationsFixtureOptions(
        this.test?.fullTitle(),
        setupMocks(ResultType.Malicious),
      ),
      async ({ driver, localNodes }) => {
        await login(driver, { expectedBalance: '10' });
        await createDappTransaction(driver, TRANSACTION_MOCK);
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        const confirmation = new TransactionConfirmation(driver);
        await confirmation.checkPageIsLoaded();
        await confirmation.checkEnforcedSimulationsRowIsDisplayed();

        const { receipt, tx } = await confirmAndGetTransaction(
          driver,
          confirmation,
          localNodes[0],
          'confirmed',
        );

        assert.strictEqual(
          receipt.status,
          'success',
          `Expected on-chain tx to succeed, got ${receipt.status}`,
        );
        assert.strictEqual(
          receipt.to?.toLowerCase(),
          DELEGATION_MANAGER_ADDRESS,
          `Expected receipt.to to be DelegationManager, got ${receipt.to}`,
        );
        assert.notStrictEqual(
          tx.type,
          'eip7702',
          `Expected pre-delegated tx not to upgrade, got ${tx.type}`,
        );

        const dataHex = (tx.input ?? '0x').toLowerCase();

        assert.ok(
          dataHex.startsWith(REDEEM_DELEGATIONS_SELECTOR),
          `Expected tx.input to start with redeemDelegations, got ${dataHex.slice(0, 10)}`,
        );
        assert.ok(
          dataHex.includes(ERC20_BALANCE_CHANGE_ENFORCER),
          `Expected tx.input to reference ERC20BalanceChangeEnforcer`,
        );
        assert.ok(
          dataHex.includes(USDC_ADDRESS.slice(2).toLowerCase()),
          `Expected tx.input to reference USDC token`,
        );
      },
    );
  });

  it('does not enforce simulations when the recipient is trusted', async function () {
    await withFixtures(
      enforcedSimulationsFixtureOptions(
        this.test?.fullTitle(),
        setupMocks(ResultType.Trusted),
      ),
      async ({ driver, localNodes }) => {
        await login(driver, { expectedBalance: '10' });
        await createDappTransaction(driver, TRANSACTION_MOCK);
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        const confirmation = new TransactionConfirmation(driver);
        await confirmation.checkPageIsLoaded();

        const { receipt, tx } = await confirmAndGetTransaction(
          driver,
          confirmation,
          localNodes[0],
          'confirmed',
        );

        assert.strictEqual(
          receipt.status,
          'success',
          `Expected on-chain tx to succeed, got ${receipt.status}`,
        );
        assert.strictEqual(
          receipt.to?.toLowerCase(),
          USDC_ADDRESS.toLowerCase(),
          `Expected receipt.to to be USDC, got ${receipt.to}`,
        );
        assert.notStrictEqual(
          tx.type,
          'eip7702',
          `Expected pre-delegated tx not to upgrade, got ${tx.type}`,
        );
        assert.strictEqual(
          (tx.input ?? '0x').toLowerCase(),
          USDC_TRANSFER_CALLDATA.toLowerCase(),
          `Expected tx.input to be original USDC transfer calldata`,
        );

        assert.strictEqual(tx.value, 0n, `Expected tx.value 0`);
      },
    );
  });

  it('upgrades the account so enforcement can run when it is not yet delegated', async function () {
    await withFixtures(
      enforcedSimulationsFixtureOptions(
        this.test?.fullTitle(),
        setupMocks(ResultType.Malicious),
      ),
      async ({ driver, localNodes }) => {
        const { publicClient, testClient } = localNodes[0].getProvider();

        await testClient.setCode({
          address: SENDER_ADDRESS_MOCK as `0x${string}`,
          bytecode: '0x',
        });

        const codeBefore = await publicClient.getCode({
          address: SENDER_ADDRESS_MOCK as `0x${string}`,
        });

        assert.ok(
          !codeBefore || codeBefore === '0x',
          `Expected sender to start with no delegation, got ${codeBefore}`,
        );

        await login(driver, { expectedBalance: '10' });
        await createDappTransaction(driver, TRANSACTION_MOCK);
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        const confirmation = new TransactionConfirmation(driver);
        await confirmation.checkPageIsLoaded();
        await confirmation.checkEnforcedSimulationsRowIsDisplayed();

        const { receipt, tx } = await confirmAndGetTransaction(
          driver,
          confirmation,
          localNodes[0],
          'confirmed',
        );

        assert.strictEqual(
          receipt.status,
          'success',
          `Expected on-chain tx to succeed, got ${receipt.status}`,
        );
        assert.strictEqual(
          tx.type,
          'eip7702',
          `Expected on-chain tx type eip7702, got ${tx.type}`,
        );

        const authList =
          'authorizationList' in tx
            ? ((tx.authorizationList as readonly unknown[] | undefined) ?? [])
            : [];

        assert.ok(authList.length > 0, `Expected non-empty authorizationList`);

        assert.strictEqual(
          receipt.to?.toLowerCase(),
          DELEGATION_MANAGER_ADDRESS,
          `Expected receipt.to to be DelegationManager, got ${receipt.to}`,
        );

        const codeAfter = await publicClient.getCode({
          address: SENDER_ADDRESS_MOCK as `0x${string}`,
        });
        assert.ok(
          codeAfter?.toLowerCase().startsWith('0xef0100'),
          `Expected sender code after tx to be a 7702 pointer, got ${codeAfter}`,
        );
      },
    );
  });

  it('does not enforce simulations when the user disables enforcement', async function () {
    await withFixtures(
      enforcedSimulationsFixtureOptions(
        this.test?.fullTitle(),
        setupMocks(ResultType.Benign),
      ),
      async ({ driver, localNodes }) => {
        await login(driver, { expectedBalance: '10' });
        await createDappTransaction(driver, TRANSACTION_MOCK);
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        const confirmation = new TransactionConfirmation(driver);
        await confirmation.checkPageIsLoaded();
        await confirmation.checkEnforcedSimulationsRowIsDisplayed();
        await confirmation.clickEnforcedSimulationsToggle();
        await confirmation.checkEnforcedSimulationsToggleUnchecked();

        const { receipt, tx } = await confirmAndGetTransaction(
          driver,
          confirmation,
          localNodes[0],
          'confirmed',
        );

        assert.strictEqual(
          receipt.status,
          'success',
          `Expected on-chain tx to succeed, got ${receipt.status}`,
        );
        assert.strictEqual(
          receipt.to?.toLowerCase(),
          USDC_ADDRESS.toLowerCase(),
          `Expected receipt.to to be USDC, got ${receipt.to}`,
        );
        assert.notStrictEqual(
          tx.type,
          'eip7702',
          `Expected pre-delegated tx not to upgrade, got ${tx.type}`,
        );
        assert.strictEqual(
          (tx.input ?? '0x').toLowerCase(),
          USDC_TRANSFER_CALLDATA.toLowerCase(),
          `Expected tx.input to be original USDC transfer calldata`,
        );

        assert.strictEqual(tx.value, 0n, `Expected tx.value 0`);
      },
    );
  });

  it('reverts on-chain when the actual balance change exceeds the simulation', async function () {
    await withFixtures(
      enforcedSimulationsFixtureOptions(
        this.test?.fullTitle(),
        setupMocks(ResultType.Malicious),
      ),
      async ({ driver, localNodes }) => {
        await login(driver, { expectedBalance: '10' });
        await createDappTransaction(driver, {
          ...TRANSACTION_MOCK,
          data: USDC_LARGE_TRANSFER_CALLDATA,
        });
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        const confirmation = new TransactionConfirmation(driver);
        await confirmation.checkPageIsLoaded();
        await confirmation.checkEnforcedSimulationsRowIsDisplayed();

        const { receipt, revertReason } = await confirmAndGetTransaction(
          driver,
          confirmation,
          localNodes[0],
          'failed',
        );

        assert.strictEqual(
          receipt.status,
          'reverted',
          `Expected on-chain tx to revert, got ${receipt.status}`,
        );
        assert.ok(
          revertReason?.includes('ERC20BalanceChangeEnforcer'),
          `Expected revert from ERC20BalanceChangeEnforcer, got ${revertReason}`,
        );
      },
    );
  });
});

function setupMocks(trustResultType: ResultType) {
  return async (mockServer: MockttpServer): Promise<MockedEndpoint[]> => {
    const eip7702Mocks = await mockEip7702FeatureFlag(mockServer);
    const trustMocks = await mockTrustSignal(mockServer, trustResultType);
    await mockSimulationApi(mockServer, {
      sender: SENDER_ADDRESS_MOCK,
      recipient: RECIPIENT_ADDRESS,
      token: USDC_ADDRESS,
      amountHex: USDC_TRANSFER_AMOUNT_HEX,
      preBalanceHex: USDC_SENDER_PRE_BALANCE_HEX,
      postBalanceHex: USDC_SENDER_POST_BALANCE_HEX,
    });
    return [...eip7702Mocks, ...trustMocks];
  };
}

function enforcedSimulationsFixtureOptions(
  title: string | undefined,
  testSpecificMock: (server: MockttpServer) => Promise<MockedEndpoint[]>,
) {
  return {
    dappOptions: { numberOfTestDapps: 1 },
    fixtures: new FixtureBuilderV2()
      .withEnabledNetworks({ eip155: { '0x1': true } })
      .withPermissionControllerConnectedToTestDapp({ chainIds: [1] })
      .withSmartTransactionsOptedOut()
      .build(),
    localNodeOptions: {
      chainId: 1,
      hardfork: 'Prague',
      loadState: ENFORCED_SIMULATIONS_LOAD_STATE,
    },
    testSpecificMock,
    title,
  };
}

async function confirmAndGetTransaction(
  driver: Driver,
  confirmation: TransactionConfirmation,
  anvil: Anvil,
  expectedStatus: 'confirmed' | 'failed',
) {
  await confirmation.clickFooterConfirmButton();

  await driver.switchToWindowWithTitle(WINDOW_TITLES.ExtensionInFullScreenView);

  const activityList = new ActivityListPage(driver);
  await activityList.openActivityTab();

  if (expectedStatus === 'confirmed') {
    await activityList.checkConfirmedTxNumberDisplayedInActivity(1);
  } else {
    await activityList.checkFailedTxNumberDisplayedInActivity(1);
  }

  await driver.switchToWindowWithTitle(
    WINDOW_TITLES.TestDappSendIndividualRequest,
  );

  const txHash = await new TestDappIndividualRequest(
    driver,
  ).getResult<`0x${string}`>();

  return getTransactionDetails(anvil, txHash);
}
