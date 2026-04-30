import { MockttpServer } from 'mockttp';
import { login } from '../../page-objects/flows/login.flow';
import {
  createInternalTransaction,
  createDappTransaction,
} from '../../page-objects/flows/transaction';
import { WINDOW_TITLES } from '../../constants';
import { withFixtures } from '../../helpers';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import TransactionConfirmation from '../../page-objects/pages/confirmations/transaction-confirmation';
import ActivityListPage from '../../page-objects/pages/home/activity-list';
import GasFeeModal from '../../page-objects/pages/confirmations/gas-fee-modal';
import { mockSpotPrices } from '../tokens/utils/mocks';

const PREFERENCES_STATE_MOCK = {
  preferences: {
    showFiatInTestnets: true,
  },
  // Enables advanced details due to migration 123
  useNonceField: true,
};

describe('Editing Confirm Transaction', function () {
  it('allows selecting high, medium, low gas estimates on edit gas fee popover', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        localNodeOptions: { hardfork: 'london' },
        title: this.test?.fullTitle(),
      },
      async ({ driver }) => {
        await login(driver);

        await createInternalTransaction({ driver });

        const transactionConfirmation = new TransactionConfirmation(driver);
        const gasFeeModal = new GasFeeModal(driver);
        const activityListPage = new ActivityListPage(driver);

        await transactionConfirmation.checkSendAmount('1 ETH');

        // update estimates to high
        await transactionConfirmation.openGasFeeModal();
        await gasFeeModal.checkEstimatesModalIsDisplayed();
        await gasFeeModal.selectHighGasFee();

        await transactionConfirmation.checkGasFeeLabel('Aggressive');

        // update estimates to medium
        await transactionConfirmation.openGasFeeModal();
        await gasFeeModal.checkEstimatesModalIsDisplayed();
        await gasFeeModal.selectMediumGasFee();

        await transactionConfirmation.checkGasFeeLabel('Market');

        // update estimates to low
        await transactionConfirmation.openGasFeeModal();
        await gasFeeModal.checkEstimatesModalIsDisplayed();
        await gasFeeModal.selectLowGasFee();

        await transactionConfirmation.checkGasFeeLabel('Slow');

        await transactionConfirmation.checkInlineAlertIsDisplayed();

        // confirms the transaction
        await transactionConfirmation.clickFooterConfirmButtonAndWaitToDisappear();

        // check transaction in activity tab
        await activityListPage.openActivityTab();
        await activityListPage.checkWaitForTransactionStatus('confirmed');

        await activityListPage.checkTransactionAmount('-1 ETH');
      },
    );
  });

  it('allows accessing advance gas fee popover from edit gas fee popover', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2()
          .withPreferencesController(PREFERENCES_STATE_MOCK)
          .build(),
        localNodeOptions: { hardfork: 'london' },
        title: this.test?.fullTitle(),
        testSpecificMock: async (mockServer: MockttpServer) => {
          await mockSpotPrices(mockServer, {
            'eip155:1/slip44:60': {
              price: 1700,
              marketCap: 382623505141,
              pricePercentChange1d: 0,
            },
          });
        },
      },
      async ({ driver }) => {
        await login(driver);
        await createInternalTransaction({ driver });

        const transactionConfirmation = new TransactionConfirmation(driver);
        const gasFeeModal = new GasFeeModal(driver);
        const activityListPage = new ActivityListPage(driver);

        await transactionConfirmation.checkSendAmount('1 ETH');

        // open gas fee modal and set custom values
        await transactionConfirmation.openGasFeeModal();
        await gasFeeModal.setCustomEIP1559GasFee({
          maxBaseFee: '8.5',
          priorityFee: '8.5',
          gasLimit: '100000',
        });

        // has correct updated value on the confirm screen the transaction
        await transactionConfirmation.checkGasFeeFiat('$0.30');

        // confirms the transaction
        await transactionConfirmation.clickFooterConfirmButtonAndWaitToDisappear();

        await activityListPage.openActivityTab();
        await activityListPage.checkWaitForTransactionStatus('confirmed');

        await activityListPage.checkTransactionAmount('-1 ETH');
      },
    );
  });

  it('should use dapp suggested estimates for transaction coming from dapp', async function () {
    await withFixtures(
      {
        dappOptions: { numberOfTestDapps: 1 },
        fixtures: new FixtureBuilderV2()
          .withPermissionControllerConnectedToTestDapp()
          .withPreferencesController(PREFERENCES_STATE_MOCK)
          .build(),
        localNodeOptions: { hardfork: 'london' },
        title: this.test?.fullTitle(),
        testSpecificMock: async (mockServer: MockttpServer) => {
          await mockSpotPrices(mockServer, {
            'eip155:1/slip44:60': {
              price: 1700,
              marketCap: 382623505141,
              pricePercentChange1d: 0,
            },
          });
        },
      },
      async ({ driver }) => {
        // login to extension
        await login(driver);

        await createDappTransaction(driver, {
          maxFeePerGas: '0x2000000000',
          maxPriorityFeePerGas: '0x1000000000',
        });

        const transactionConfirmation = new TransactionConfirmation(driver);
        const gasFeeModal = new GasFeeModal(driver);
        const activityListPage = new ActivityListPage(driver);

        // check transaction in extension popup
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        await transactionConfirmation.checkGasFeeLabel('Site suggested');

        await transactionConfirmation.openGasFeeModal();
        await gasFeeModal.checkEstimatesModalIsDisplayed();
        // this is to test in MV3 a racing issue when request for suggestedGasFees is not fetched properly
        // some data would not be defined yet
        await gasFeeModal.selectSiteSuggestedGasFee();

        await transactionConfirmation.checkGasFeeEstimate('0.001 ETH');

        // has correct updated value on the confirm screen the transaction
        await transactionConfirmation.checkGasFeeFiat('$3.15');

        // confirms the transaction
        await transactionConfirmation.clickFooterConfirmButton();

        // transaction should correct values in activity tab
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );

        await activityListPage.openActivityTab();
        await activityListPage.checkWaitForTransactionStatus('confirmed');

        await activityListPage.checkTransactionAmount('-0.001 ETH');
      },
    );
  });
});
