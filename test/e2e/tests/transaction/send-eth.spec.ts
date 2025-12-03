import assert from 'node:assert';
import { Mockttp } from 'mockttp';
import ActivityListPage from '../../page-objects/pages/home/activity-list';
import HomePage from '../../page-objects/pages/home/homepage';
import TransactionDetailsPage from '../../page-objects/pages/home/transaction-details';
import SendTokenConfirmPage from '../../page-objects/pages/send/send-token-confirmation-page';
import SendTokenPage from '../../page-objects/pages/send/send-token-page';
import TestDapp from '../../page-objects/pages/test-dapp';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';
import { DAPP_URL, WINDOW_TITLES, withFixtures } from '../../helpers';
import FixtureBuilder from '../../fixtures/fixture-builder';
import { SMART_CONTRACTS } from '../../seeder/smart-contracts';
import { CHAIN_IDS } from '../../../../shared/constants/network';
import { mockSpotPrices } from '../tokens/utils/mocks';
import TransactionConfirmation from '../../page-objects/pages/confirmations/redesign/transaction-confirmation';

const PREFERENCES_STATE_MOCK = {
  preferences: {
    showFiatInTestnets: true,
  },
  // Enables advanced details due to migration 123
  useNonceField: true,
};

describe('Send ETH', function () {
  describe('from inside MetaMask', function () {
    it('finds the transaction in the transactions list using default gas', async function () {
      await withFixtures(
        {
          fixtures: new FixtureBuilder().build(),
          title: this.test?.fullTitle(),
        },
        async ({ driver }) => {
          await loginWithBalanceValidation(driver);

          const homePage = new HomePage(driver);
          await homePage.startSendFlow();

          const sendTokenPage = new SendTokenPage(driver);
          await sendTokenPage.checkPageIsLoaded();
          await sendTokenPage.fillRecipient(
            '0x2f318C334780961FB129D2a6c30D0763d9a5C970',
          );

          // Verify Insufficient funds error message is displayed
          await sendTokenPage.fillAmount('10000');
          await sendTokenPage.checkInsufficientFundsErrorIsDisplayed();

          // Clear amount
          await sendTokenPage.clickMaxClearAmountButton();

          await sendTokenPage.fillAmount('1');
          await sendTokenPage.goToNextScreen();

          const sendTokenConfirmationPage = new SendTokenConfirmPage(driver);
          await sendTokenConfirmationPage.checkPageIsLoaded();
          await sendTokenConfirmationPage.checkTokenTransfer({
            sender: 'Account 1',
            recipient: '0x2f318...5C970',
            amount: '1',
            tokenName: 'ETH',
          });

          await sendTokenConfirmationPage.clickOnConfirm();

          await homePage.goToActivityList();
          const activityList = new ActivityListPage(driver);
          await activityList.checkConfirmedTxNumberDisplayedInActivity(1);

          await activityList.checkTxAction({ action: 'Sent' });
          await activityList.checkTxAmountInActivity('-1 ETH', 1);
        },
      );
    });

    it('finds the transaction in the transactions list using advanced gas modal', async function () {
      await withFixtures(
        {
          fixtures: new FixtureBuilder().build(),
          title: this.test?.fullTitle(),
        },
        async ({ driver }) => {
          await loginWithBalanceValidation(driver);

          const homePage = new HomePage(driver);
          await homePage.startSendFlow();

          const sendTokenPage = new SendTokenPage(driver);
          await sendTokenPage.checkPageIsLoaded();
          await sendTokenPage.fillRecipient(
            '0x2f318C334780961FB129D2a6c30D0763d9a5C970',
          );
          await sendTokenPage.fillAmount('1');
          await sendTokenPage.goToNextScreen();
          const transactionConfirmation = new TransactionConfirmation(driver);
          await transactionConfirmation.checkPageIsLoaded();

          // Use Advanced Gas Modal to set custom gas
          await transactionConfirmation.editGasLimitLondon('31000');

          await transactionConfirmation.clickFooterConfirmButtonAndWaitToDisappear();

          await homePage.goToActivityList();
          const activityList = new ActivityListPage(driver);
          await activityList.checkConfirmedTxNumberDisplayedInActivity(1);

          await activityList.checkTxAction({ action: 'Sent' });
          await activityList.checkTxAmountInActivity('-1 ETH', 1);
        },
      );
    });

    it('finds the transaction in the transactions list when sending to a Multisig Address', async function () {
      const smartContract = SMART_CONTRACTS.MULTISIG;
      await withFixtures(
        {
          fixtures: new FixtureBuilder().build(),
          smartContract,
          title: this.test?.fullTitle(),
        },
        async ({ driver, contractRegistry, localNodes }) => {
          const contractAddress =
            await contractRegistry.getContractAddress(smartContract);
          await loginWithBalanceValidation(driver, localNodes[0]);

          const homePage = new HomePage(driver);
          await homePage.startSendFlow();

          const sendTokenPage = new SendTokenPage(driver);
          await sendTokenPage.checkPageIsLoaded();
          await sendTokenPage.fillRecipient(contractAddress);
          await sendTokenPage.fillAmount('1');
          await sendTokenPage.goToNextScreen();

          const sendTokenConfirmationPage = new SendTokenConfirmPage(driver);
          await sendTokenConfirmationPage.clickOnConfirm();

          await homePage.goToActivityList();
          const activityList = new ActivityListPage(driver);
          await activityList.checkConfirmedTxNumberDisplayedInActivity(1);

          await activityList.checkTxAction({ action: 'Contract interaction' });
          await activityList.checkTxAmountInActivity('-1 ETH', 1);
        },
      );
    });

    it('shows no error when cancel transaction when sending via QR code', async function () {
      await withFixtures(
        {
          fixtures: new FixtureBuilder().build(),
          title: this.test?.fullTitle(),
        },
        async ({ driver }) => {
          await loginWithBalanceValidation(driver);

          const homePage = new HomePage(driver);
          await homePage.startSendFlow();

          const sendTokenPage = new SendTokenPage(driver);
          await sendTokenPage.checkPageIsLoaded();

          // choose to scan via QR code
          await sendTokenPage.clickScanButton();
          await sendTokenPage.checkScanModalIsDisplayed();

          // cancel action will close the dialog and shut down camera initialization
          await sendTokenPage.clickCancelScanButton();
        },
      );
    });

    describe('from dapp using advanced gas controls', function () {
      it('should display the correct gas price on the legacy transaction', async function () {
        await withFixtures(
          {
            dappOptions: { numberOfTestDapps: 1 },
            fixtures: new FixtureBuilder()
              .withPermissionControllerConnectedToTestDapp()
              .withPreferencesController(PREFERENCES_STATE_MOCK)
              .build(),
            title: this.test?.fullTitle(),
            localNodeOptions: {
              hardfork: 'muirGlacier',
            },
            testSpecificMock: async (mockServer: Mockttp) => {
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

            // initiates a send from the dapp
            const testDapp = new TestDapp(driver);
            await testDapp.openTestDappPage();
            await testDapp.clickSimpleSendButton();
            await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

            // update estimates to high
            const transactionConfirmation = new TransactionConfirmation(driver);
            await transactionConfirmation.checkPageIsLoaded();

            // enter gas limit and gas price
            await transactionConfirmation.editSuggestedGasFeeLegacy(
              '100000',
              '100',
            );

            // has correct updated value on the confirm screen the transaction
            await transactionConfirmation.checkGasFee('0.0021');

            // confirms the transaction
            await transactionConfirmation.clickFooterConfirmButtonAndAndWaitForWindowToClose();
            await driver.switchToWindowWithTitle(
              WINDOW_TITLES.ExtensionInFullScreenView,
            );
            const activityListPage = new ActivityListPage(driver);
            await activityListPage.openActivityTab();
            await activityListPage.checkCompletedTransactionItems(1);
            await activityListPage.checkTransactionAmount('-0 ETH');

            // the transaction has the expected gas price
            await activityListPage.clickOnActivity(1);
            const transactionDetails = new TransactionDetailsPage(driver);
            await transactionDetails.checkTransactionGasPrice('100');
          },
        );
      });

      it.only('should display correct gas values for EIP-1559 transaction', async function () {
        await withFixtures(
          {
            dappOptions: { numberOfTestDapps: 1 },
            fixtures: new FixtureBuilder()
              .withPermissionControllerConnectedToTestDapp()
              .withPreferencesController(PREFERENCES_STATE_MOCK)
              .build(),
            title: this.test?.fullTitle(),
            testSpecificMock: async (mockServer: Mockttp) => {
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

            // initiates a send from the dapp
            const testDapp = new TestDapp(driver);
            await testDapp.openTestDappPage();
            await testDapp.clickERC20CreateTokenButton();
            await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

            const sendTokenConfirmationPage = new SendTokenConfirmPage(driver);
            await sendTokenConfirmationPage.clickEditGasFeeIcon();
            //await sendTokenConfirmationPage.clickOnAdvancedFees();
            await sendTokenConfirmationPage.enterMaxPriorityFee('1');
            await sendTokenConfirmationPage.enterMaxBaseFee('25');
            await sendTokenConfirmationPage.clickOnSave();

            // confirms the transaction
            await sendTokenConfirmationPage.clickMetaMaskDialogConfirm();
            await driver.switchToWindowWithTitle(
              WINDOW_TITLES.ExtensionInFullScreenView,
            );
            const activityListPage = new ActivityListPage(driver);
            await activityListPage.openActivityTab();
            await activityListPage.checkCompletedTransactionItems(1);
            await activityListPage.checkTransactionAmount('-0 ETH');

            // the transaction has the expected gas value
              await activityListPage.clickOnActivity(1);
            const transactionDetails = new TransactionDetailsPage(driver);
            await transactionDetails.checkTransactionBaseFee('0.343608917');
          },
        );
      });
    });

    describe('to non-contract address with data that matches ERC20 transfer data signature', function () {
      it('renders the correct recipient on the confirmation screen', async function () {
        await withFixtures(
          {
            fixtures: new FixtureBuilder()
              .withPreferencesController({
                featureFlags: {
                  sendHexData: true,
                },
              })
              .withPreferencesControllerPetnamesDisabled()
              .build(),
            title: this.test?.fullTitle(),
          },
          async ({ driver }) => {
            await loginWithBalanceValidation(driver);

            const homePage = new HomePage(driver);
            await homePage.startSendFlow();

            // user should land on send token screen to fill recipient and amount
            const sendTokenPage = new SendTokenPage(driver);
            await sendTokenPage.checkPageIsLoaded();
            await sendTokenPage.fillRecipient(
              '0xc427D562164062a23a5cFf596A4a3208e72Acd28',
            );
            await sendTokenPage.fillHexInput(
              '0xa9059cbb0000000000000000000000002f318C334780961FB129D2a6c30D0763d9a5C970000000000000000000000000000000000000000000000000000000000000000a',
            );
            await sendTokenPage.goToNextScreen();

            const sendTokenConfirmationPage = new SendTokenConfirmPage(driver);
            await sendTokenConfirmationPage.checkPageIsLoaded();
            await sendTokenConfirmationPage.checkTokenTransfer({
              sender: 'Account 1',
              recipient: '0xc427D...Acd28',
              amount: '0',
              tokenName: 'ETH',
            });
          },
        );
      });
    });
  });
});
