import { strict as assert } from 'assert';
import { MockttpServer } from 'mockttp';
import { SMART_CONTRACTS } from '../../seeder/smart-contracts';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';
import { WINDOW_TITLES } from '../../constants';
import { withFixtures } from '../../helpers';
import FixtureBuilder from '../../fixtures/fixture-builder';
import { mockSpotPrices } from '../tokens/utils/mocks';
import { Driver } from '../../webdriver/driver';
import GasFeeModal from '../../page-objects/pages/confirmations/gas-fee-modal';
import SendTokenConfirmPage from '../../page-objects/pages/send/send-token-confirmation-page';
import ActivityListPage from '../../page-objects/pages/home/activity-list';
import HomePage from '../../page-objects/pages/home/homepage';
import SendPage from '../../page-objects/pages/send/send-page';
import TestDapp from '../../page-objects/pages/test-dapp';
import { Anvil } from '../../seeder/anvil';
import { createInternalTransaction } from '../../page-objects/flows/transaction.flow';

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
        async ({ driver }: { driver: Driver }) => {
          await loginWithBalanceValidation(driver);

          const homePage = new HomePage(driver);
          const sendPage = new SendPage(driver);
          const sendTokenConfirmPage = new SendTokenConfirmPage(driver);
          const activityListPage = new ActivityListPage(driver);

          await homePage.startSendFlow();

          await sendPage.selectToken('0x539', 'ETH');
          await sendPage.fillRecipient(
            '0x2f318C334780961FB129D2a6c30D0763d9a5C970',
          );

          // Type 1000 to trigger insufficient funds error
          await sendPage.fillAmount('1000');
          await sendPage.checkInsufficientFundsErrorDetailed();

          // Remove last 3 characters
          await sendPage.pressOnAmountInput('BACK_SPACE');
          await sendPage.pressOnAmountInput('BACK_SPACE');
          await sendPage.pressOnAmountInput('BACK_SPACE');

          // Click max button and verify amount is greater than 24
          await sendPage.clickMaxButton();
          let inputValue = await sendPage.getAmountInputValue();
          assert(
            Number(inputValue) > 24,
            `Expected amount > 24, got ${inputValue}`,
          );

          // Click max/clear button again to clear the amount
          await sendPage.clickMaxButton();

          // Fill with 1 ETH
          await sendPage.fillAmount('1');
          inputValue = await sendPage.getAmountInputValue();
          assert.equal(inputValue, '1');

          await sendPage.pressContinueButton();
          await sendTokenConfirmPage.clickOnConfirm();

          await activityListPage.openActivityTab();
          await activityListPage.checkConfirmedTxNumberDisplayedInActivity(1);
          await activityListPage.checkTxAmountInActivity('-1 ETH');
        },
      );
    });

    it('displays the correct amount on the confirmation screen', async function () {
      await withFixtures(
        {
          fixtures: new FixtureBuilder().build(),
          title: this.test?.fullTitle(),
        },
        async ({ driver }: { driver: Driver }) => {
          await loginWithBalanceValidation(driver);

          const sendTokenConfirmPage = new SendTokenConfirmPage(driver);
          const activityListPage = new ActivityListPage(driver);

          await createInternalTransaction({
            driver,
            recipientAddress: '0x2f318C334780961FB129D2a6c30D0763d9a5C970',
            amount: '1',
          });

          // Verify transaction amount on confirmation screen
          await sendTokenConfirmPage.checkTransactionAmount('1 ETH');

          await sendTokenConfirmPage.clickOnConfirm();

          await activityListPage.openActivityTab();
          await activityListPage.checkConfirmedTxNumberDisplayedInActivity(1);
          await activityListPage.checkTxAmountInActivity('-1 ETH');
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
        async ({
          driver,
          contractRegistry,
          localNodes,
        }: {
          driver: Driver;
          contractRegistry: {
            getContractAddress: (contract: string) => Promise<string>;
          };
          localNodes: Anvil[];
        }) => {
          const contractAddress =
            await contractRegistry.getContractAddress(smartContract);
          await loginWithBalanceValidation(driver, localNodes[0]);

          const homePage = new HomePage(driver);
          const sendTokenConfirmPage = new SendTokenConfirmPage(driver);
          const activityListPage = new ActivityListPage(driver);

          await createInternalTransaction({
            driver,
            recipientAddress: contractAddress,
            amount: '1',
          });
          await sendTokenConfirmPage.clickOnConfirm();

          // Verify balance is displayed correctly (format: "X.XX ETH")
          await homePage.checkBalanceIsDisplayed();

          await activityListPage.openActivityTab();
          await activityListPage.checkConfirmedTxNumberDisplayedInActivity(1);
          await activityListPage.checkNoFailedTransactions();
        },
      );
    });

    describe('from dapp using advanced gas controls', function () {
      it('displays the correct gas price on the legacy transaction', async function () {
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
          async ({ driver }: { driver: Driver }) => {
            await loginWithBalanceValidation(driver);

            const testDapp = new TestDapp(driver);
            const sendTokenConfirmPage = new SendTokenConfirmPage(driver);
            const gasFeeModal = new GasFeeModal(driver);
            const activityListPage = new ActivityListPage(driver);

            // Initiate a send from the dapp
            await testDapp.openTestDappPage();
            await testDapp.clickSimpleSendButton();
            await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

            // Open gas fee modal and set custom legacy gas values
            await sendTokenConfirmPage.clickEditGasFeeIcon();
            await gasFeeModal.setCustomLegacyGasFee({
              gasPrice: '100',
              gasLimit: '21000',
            });

            await sendTokenConfirmPage.checkFirstGasFee('0.0021');
            await sendTokenConfirmPage.checkNativeCurrency('$3.57');

            await sendTokenConfirmPage.confirmAndWaitForWindowToClose();
            await driver.switchToWindowWithTitle(
              WINDOW_TITLES.ExtensionInFullScreenView,
            );

            // Find the transaction in the transactions list
            await activityListPage.openActivityTab();
            await activityListPage.checkConfirmedTxNumberDisplayedInActivity(1);
            await activityListPage.checkTxAmountInActivity('-0 ETH');

            // Verify the transaction has the expected gas price
            await activityListPage.clickOnActivity(1);
            await activityListPage.checkGasPrice('100');
          },
        );
      });

      it('displays correct gas values for EIP-1559 transaction', async function () {
        await withFixtures(
          {
            dappOptions: { numberOfTestDapps: 1 },
            fixtures: new FixtureBuilder()
              .withPermissionControllerConnectedToTestDapp()
              .withPreferencesController(PREFERENCES_STATE_MOCK)
              .build(),
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
          async ({ driver }: { driver: Driver }) => {
            await loginWithBalanceValidation(driver);

            const testDapp = new TestDapp(driver);
            const sendTokenConfirmPage = new SendTokenConfirmPage(driver);
            const gasFeeModal = new GasFeeModal(driver);
            const activityListPage = new ActivityListPage(driver);
            const homePage = new HomePage(driver);

            // Initiate a transaction from the dapp
            await testDapp.openTestDappPage();
            await testDapp.clickCreateToken();
            await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

            // Open gas fee modal and set custom EIP-1559 gas values
            await sendTokenConfirmPage.clickEditGasFeeIcon();
            await gasFeeModal.setCustomEIP1559GasFee({
              maxBaseFee: '25',
              priorityFee: '1',
            });

            await sendTokenConfirmPage.checkFirstGasFee('0.045');
            await sendTokenConfirmPage.checkNativeCurrency('$76.59');

            await sendTokenConfirmPage.confirmAndWaitForWindowToClose();
            await driver.switchToWindowWithTitle(
              WINDOW_TITLES.ExtensionInFullScreenView,
            );

            // Verify balance is displayed (format only, not exact value since gas was consumed)
            await homePage.checkBalanceIsDisplayed();

            // Find the transaction in the transactions list
            await activityListPage.openActivityTab();
            await activityListPage.checkConfirmedTxNumberDisplayedInActivity(1);
            await activityListPage.checkTxAmountInActivity('-0 ETH');

            // Verify the transaction has the expected gas values
            await activityListPage.clickOnActivity(1);
            await activityListPage.checkFeeValuesAreDisplayed();
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
          async ({ driver }: { driver: Driver }) => {
            await loginWithBalanceValidation(driver);

            const homePage = new HomePage(driver);
            const sendPage = new SendPage(driver);
            const sendTokenConfirmPage = new SendTokenConfirmPage(driver);

            await homePage.startSendFlow();

            await sendPage.selectToken('0x539', 'ETH');

            await sendPage.fillRecipient(
              '0xc427D562164062a23a5cFf596A4a3208e72Acd28',
            );

            await sendPage.fillHexData(
              '0xa9059cbb0000000000000000000000002f318C334780961FB129D2a6c30D0763d9a5C970000000000000000000000000000000000000000000000000000000000000000a',
            );

            await sendPage.pressContinueButton();

            // Verify the recipient address is displayed correctly (should show the actual recipient, not the one in the data)
            await sendTokenConfirmPage.checkRecipientAddressDisplayedCount(
              '0xc427D...Acd28',
              1,
            );
          },
        );
      });
    });
  });
});
