import { MockttpServer } from 'mockttp';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';
import {
  createInternalTransaction,
  createDappTransaction,
} from '../../page-objects/flows/transaction';
import { withFixtures, WINDOW_TITLES } from '../../helpers';
import FixtureBuilder from '../../fixtures/fixture-builder';
import SendTokenConfirmPage from '../../page-objects/pages/send/send-token-confirmation-page';
import ActivityListPage from '../../page-objects/pages/home/activity-list';
import { CHAIN_IDS } from '../../../../shared/constants/network';
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
        fixtures: new FixtureBuilder().build(),
        localNodeOptions: { hardfork: 'london' },
        title: this.test?.fullTitle(),
      },
      async ({ driver }) => {
        await loginWithBalanceValidation(driver);

        await createInternalTransaction(driver);

        const sendTokenConfirmationPage = new SendTokenConfirmPage(driver);
        const activityListPage = new ActivityListPage(driver);

        await sendTokenConfirmationPage.checkTokenAmountTransfer({
          amount: '1',
          tokenName: 'ETH',
        });

        // update estimates to high
        await sendTokenConfirmationPage.updateGasFee('high');

        await sendTokenConfirmationPage.checkGasFee('Aggressive');

        // update estimates to medium
        await sendTokenConfirmationPage.updateGasFee('medium');

        await sendTokenConfirmationPage.checkGasFee('Market');

        // update estimates to low
        await sendTokenConfirmationPage.updateGasFee('low');

        await sendTokenConfirmationPage.checkGasFee('Slow');

        await sendTokenConfirmationPage.checkGasFeeAlert();

        // confirms the transaction
        await sendTokenConfirmationPage.clickOnConfirm();

        // check transaction in activity tab
        await activityListPage.openActivityTab();
        await activityListPage.checkCompletedTransactionItems(1);

        await activityListPage.checkTransactionAmount('-1 ETH');
      },
    );
  });

  it('allows accessing advance gas fee popover from edit gas fee popover', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder()
          .withPreferencesController(PREFERENCES_STATE_MOCK)
          .build(),
        localNodeOptions: { hardfork: 'london' },
        title: this.test?.fullTitle(),
        testSpecificMock: async (mockServer: MockttpServer) => {
          await mockSpotPrices(mockServer, CHAIN_IDS.MAINNET, {
            '0x0000000000000000000000000000000000000000': {
              price: 1700,
              marketCap: 382623505141,
              pricePercentChange1d: 0,
            },
          });
        },
      },
      async ({ driver }) => {
        await loginWithBalanceValidation(driver);
        await createInternalTransaction(driver);

        const sendTokenConfirmationPage = new SendTokenConfirmPage(driver);
        const activityListPage = new ActivityListPage(driver);

        await sendTokenConfirmationPage.checkTokenAmountTransfer({
          amount: '1',
          tokenName: 'ETH',
        });

        // update estimates to high
        await sendTokenConfirmationPage.clickEditGasFeeIcon();
        await sendTokenConfirmationPage.selectGasFeeItem('custom');

        // enter max fee
        await sendTokenConfirmationPage.enterMaxBaseFee('8.5');

        // enter priority fee
        await sendTokenConfirmationPage.enterMaxPriorityFee('8.5');

        // save default values
        await sendTokenConfirmationPage.saveDefaultValues();

        // enter gas limit
        await sendTokenConfirmationPage.enterGasLimit('100000');
        await sendTokenConfirmationPage.clickOnSave();

        // has correct updated value on the confirm screen the transaction
        await sendTokenConfirmationPage.checkFirstGasFee('0.0002');

        await sendTokenConfirmationPage.checkNativeCurrency('$0.30');

        // confirms the transaction
        await sendTokenConfirmationPage.clickOnConfirm();

        await activityListPage.openActivityTab();
        await activityListPage.checkCompletedTransactionItems(1);

        await activityListPage.checkTransactionAmount('-1 ETH');
      },
    );
  });

  it('should use dapp suggested estimates for transaction coming from dapp', async function () {
    await withFixtures(
      {
        dappOptions: { numberOfTestDapps: 1 },
        fixtures: new FixtureBuilder()
          .withPermissionControllerConnectedToTestDapp()
          .withPreferencesController(PREFERENCES_STATE_MOCK)
          .build(),
        localNodeOptions: { hardfork: 'london' },
        title: this.test?.fullTitle(),
        testSpecificMock: async (mockServer: MockttpServer) => {
          await mockSpotPrices(mockServer, CHAIN_IDS.MAINNET, {
            '0x0000000000000000000000000000000000000000': {
              price: 1700,
              marketCap: 382623505141,
              pricePercentChange1d: 0,
            },
          });
        },
      },
      async ({ driver }) => {
        // login to extension
        await loginWithBalanceValidation(driver);

        await createDappTransaction(driver, {
          maxFeePerGas: '0x2000000000',
          maxPriorityFeePerGas: '0x1000000000',
        });

        const sendTokenConfirmationPage = new SendTokenConfirmPage(driver);
        const activityListPage = new ActivityListPage(driver);

        // check transaction in extension popup
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        await sendTokenConfirmationPage.checkNetworkSpeed('Site suggested');

        await sendTokenConfirmationPage.clickEditGasFeeIcon();
        // -- should render the popover with no error
        // this is to test in MV3 a racing issue when request for suggestedGasFees is not fetched properly
        // some data would not be defined yet
        await sendTokenConfirmationPage.selectGasFeeItem('dappSuggested');

        await sendTokenConfirmationPage.checkGasFee('0.001 ETH');

        // has correct updated value on the confirm screen the transaction
        await sendTokenConfirmationPage.checkFirstGasFee('0.0019');

        await sendTokenConfirmationPage.checkNativeCurrency('$3.15');

        // confirms the transaction
        await sendTokenConfirmationPage.clickMetaMaskDialogConfirm();

        // transaction should correct values in activity tab
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );

        await activityListPage.openActivityTab();
        await activityListPage.checkCompletedTransactionItems(1);

        await activityListPage.checkTransactionAmount('-0.001 ETH');
      },
    );
  });
});
