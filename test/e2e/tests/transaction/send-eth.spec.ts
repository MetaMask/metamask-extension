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
          await sendTokenPage.fillRecipient('0x2f318C334780961FB129D2a6c30D0763d9a5C970');

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
          await sendTokenPage.fillRecipient('0x2f318C334780961FB129D2a6c30D0763d9a5C970');
          await sendTokenPage.fillAmount('1');
          await sendTokenPage.goToNextScreen();
          const sendTokenConfirmationPage = new SendTokenConfirmPage(driver);
          await sendTokenConfirmationPage.checkPageIsLoaded();

          // Use Advanced Gas Modal to set custom gas
          await sendTokenConfirmationPage.enterGasLimit('31000');
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

            const sendTokenConfirmationPage = new SendTokenConfirmPage(driver);

             // update estimates to high
            await sendTokenConfirmationPage.clickEditGasFeeIcon();
            await sendTokenConfirmationPage.clickEditSuggestedGasFeeButton();
;

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
        await driver.switchToWindowWithTitle(
              WINDOW_TITLES.ExtensionInFullScreenView,
        );
        const activityListPage = new ActivityListPage(driver);
        await activityListPage.openActivityTab();
        await activityListPage.checkCompletedTransactionItems(1);
        await activityListPage.checkTransactionAmount('-1 ETH');

        // the transaction has the expected gas price
        await activityListPage.clickOnActivity(1);
        const transactionDetails = new TransactionDetailsPage(driver);
        await transactionDetails.checkTransactionGasPrice('100');


        await driver.clickElement('[data-testid="edit-gas-fee-icon"]');
            await driver.waitForSelector({
              text: '0.000042 ETH',
            });
            await driver.clickElement({
              text: 'Edit suggested gas fee',
              tag: 'button',
            });
            await driver.waitForSelector({
              text: 'Edit priority',
              tag: 'header',
            });

            // Edit priority gas fee form
            const inputs = await driver.findElements('input[type="number"]');
            const gasLimitInput = inputs[0];
            const gasPriceInput = inputs[1];
            await gasLimitInput.fill('21000');
            await gasPriceInput.fill('100');
            await driver.clickElement({ text: 'Save', tag: 'button' });
            await driver.findElement({
              css: '[data-testid="first-gas-field"]',
              text: '0.0021',
            });

            await driver.findElement({
              css: '[data-testid="native-currency"]',
              text: '$3.57',
            });

          },
        );
      });

      it('should display correct gas values for EIP-1559 transaction', async function () {
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

            // initiates a transaction from the dapp
            await driver.openNewPage(DAPP_URL);
            await driver.clickElement({
              text: 'Create Token',
              tag: 'button',
            });

            await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

            await driver.clickElement('[data-testid="edit-gas-fee-icon"]');
            await driver.clickElement(
              '[data-testid="edit-gas-fee-item-custom"]',
            );

            const baseFeeInput = await driver.findElement(
              '[data-testid="base-fee-input"]',
            );
            await baseFeeInput.fill('25');
            const priorityFeeInput = await driver.findElement(
              '[data-testid="priority-fee-input"]',
            );
            await priorityFeeInput.fill('1');

            await driver.clickElement({ text: 'Save', tag: 'button' });

            await driver.findElement({
              css: '[data-testid="first-gas-field"]',
              text: '0.045',
            });

            await driver.findElement({
              css: '[data-testid="native-currency"]',
              text: '$76.59',
            });

            await driver.clickElementAndWaitForWindowToClose({
              text: 'Confirm',
              tag: 'button',
            });
            await driver.switchToWindowWithTitle(
              WINDOW_TITLES.ExtensionInFullScreenView,
            );

            // Identify the transaction in the transactions list
            await driver.waitForSelector(
              '[data-testid="eth-overview__primary-currency"]',
            );

            await driver.clickElement(
              '[data-testid="account-overview__activity-tab"]',
            );
            await driver.waitForSelector(
              '.transaction-list__completed-transactions .activity-list-item:nth-of-type(1)',
            );
            await driver.waitForSelector({
              css: '[data-testid="transaction-list-item-primary-currency"]',
              text: '-0 ETH',
            });

            // the transaction has the expected gas value
            await driver.clickElement(
              '[data-testid="transaction-list-item-primary-currency"]',
            );

            await driver.waitForSelector({
              xpath: "//div[contains(text(), 'Base fee')]",
            });

            const allFeeValues = await driver.findElements(
              '.currency-display-component__text',
            );

            /**
             * Below lines check that fee values are numeric.
             * Because these values change for every e2e run,
             * It's better to just check that the values are there and are numeric
             */
            assert.equal(allFeeValues.length > 0, true);

            allFeeValues.forEach(async (feeValue) => {
              assert.equal(/\d+\.?\d*/u.test(await feeValue.getText()), true);
            });
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
            await sendTokenPage.fillRecipient('0xc427D562164062a23a5cFf596A4a3208e72Acd28');
            await sendTokenPage.fillHexInput('0xa9059cbb0000000000000000000000002f318C334780961FB129D2a6c30D0763d9a5C970000000000000000000000000000000000000000000000000000000000000000a');
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
