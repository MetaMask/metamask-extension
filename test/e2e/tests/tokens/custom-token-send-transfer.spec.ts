import { Mockttp } from 'mockttp';
import { mockedSourcifyTokenSend } from '../confirmations/helpers';
import {
  withFixtures,
  openDapp,
  WINDOW_TITLES,
  unlockWallet,
} from '../../helpers';
import FixtureBuilder from '../../fixture-builder';
import { SMART_CONTRACTS } from '../../seeder/smart-contracts';
import ActivityListPage from '../../page-objects/pages/home/activity-list';
import AssetListPage from '../../page-objects/pages/home/asset-list';
import HomePage from '../../page-objects/pages/home/homepage';
import SendTokenPage from '../../page-objects/pages/send/send-token-page';
import TestDapp from '../../page-objects/pages/test-dapp';
import TokenTransferTransactionConfirmation from '../../page-objects/pages/confirmations/redesign/token-transfer-confirmation';

const recipientAddress = '0x2f318C334780961FB129D2a6c30D0763d9a5C970';

describe('Transfer custom tokens @no-mmi', function () {
  const smartContract = SMART_CONTRACTS.HST;
  const symbol = 'TST';
  const valueWithSymbol = (value: string) => `${value} ${symbol}`;
  const GAS_LIMIT = '60000';
  const GAS_PRICE = '10';

  describe('Confirmation Screens - (Redesigned)', function () {
    it('send custom tokens from extension customizing gas values', async function () {
      await withFixtures(
        {
          dapp: true,
          fixtures: new FixtureBuilder().withTokensControllerERC20().build(),
          smartContract,
          title: this.test?.fullTitle(),
          testSpecificMock: mocks,
        },
        async ({ driver }) => {
          await unlockWallet(driver);

          const homePage = new HomePage(driver);
          const assetListPage = new AssetListPage(driver);
          const sendTokenPage = new SendTokenPage(driver);
          const tokenTransferRedesignedConfirmPage =
            new TokenTransferTransactionConfirmation(driver);
          const activityListPage = new ActivityListPage(driver);

          await homePage.check_pageIsLoaded();

          // go to custom tokens view on extension, perform send tokens
          await assetListPage.openTokenDetails(symbol);
          await assetListPage.clickSendButton();

          await sendTokenPage.check_pageIsLoaded();
          await sendTokenPage.fillRecipient(recipientAddress);
          await sendTokenPage.fillAmount('1');
          await sendTokenPage.clickContinueButton();

          // check transaction details
          const expectedNetworkFee = '0.0001';
          await tokenTransferRedesignedConfirmPage.check_pageIsLoaded(
            '1',
            symbol,
            expectedNetworkFee,
          );

          // edit gas fee
          await tokenTransferRedesignedConfirmPage.editGasFee(
            GAS_LIMIT,
            GAS_PRICE,
          );
          await tokenTransferRedesignedConfirmPage.clickConfirmButton();

          // check that transaction has completed correctly and is displayed in the activity list
          await activityListPage.check_txAction(`Send ${symbol}`);
          await activityListPage.check_txAmountInActivity(
            valueWithSymbol('-1'),
          );
        },
      );
    });

    it('transfer custom tokens from dapp customizing gas values', async function () {
      await withFixtures(
        {
          dapp: true,
          fixtures: new FixtureBuilder()
            .withPermissionControllerConnectedToTestDapp()
            .withTokensControllerERC20()
            .build(),
          smartContract,
          title: this.test?.fullTitle(),
          testSpecificMock: mocks,
        },
        async ({ driver, contractRegistry }) => {
          const contractAddress = await contractRegistry.getContractAddress(
            smartContract,
          );
          await unlockWallet(driver);

          const testDapp = new TestDapp(driver);
          const homePage = new HomePage(driver);
          const assetListPage = new AssetListPage(driver);
          const tokenTransferRedesignedConfirmPage =
            new TokenTransferTransactionConfirmation(driver);
          const activityListPage = new ActivityListPage(driver);

          // transfer token from dapp
          await openDapp(driver, contractAddress);
          await testDapp.check_pageIsLoaded();
          await testDapp.clickTransferTokens();

          await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

          // check transaction details
          const expectedNetworkFee = '0.0001';
          await tokenTransferRedesignedConfirmPage.check_pageIsLoaded(
            '1.5',
            symbol,
            expectedNetworkFee,
          );

          // edit gas fee
          await tokenTransferRedesignedConfirmPage.editGasFee(
            GAS_LIMIT,
            GAS_PRICE,
          );
          await tokenTransferRedesignedConfirmPage.clickConfirmButton();

          // in extension, check that transaction has completed correctly and is displayed in the activity list
          await driver.switchToWindowWithTitle(
            WINDOW_TITLES.ExtensionInFullScreenView,
          );

          await homePage.goToActivityList();
          await activityListPage.check_txAction(`Send ${symbol}`);
          await activityListPage.check_txAmountInActivity(
            valueWithSymbol('-1.5'),
          );

          // check token amount is correct after transaction
          await homePage.goToTokensTab();
          await assetListPage.check_tokenExistsInList(
            symbol,
            valueWithSymbol('8.5'),
          );
        },
      );
    });

    it('transfer custom tokens from dapp without specifying gas', async function () {
      await withFixtures(
        {
          dapp: true,
          fixtures: new FixtureBuilder()
            .withPermissionControllerConnectedToTestDapp()
            .withTokensControllerERC20()
            .build(),
          smartContract,
          title: this.test?.fullTitle(),
          testSpecificMock: mocks,
        },
        async ({ driver, contractRegistry }) => {
          const contractAddress = await contractRegistry.getContractAddress(
            smartContract,
          );
          await unlockWallet(driver);

          const testDapp = new TestDapp(driver);
          const homePage = new HomePage(driver);
          const assetListPage = new AssetListPage(driver);
          const tokenTransferRedesignedConfirmPage =
            new TokenTransferTransactionConfirmation(driver);
          const activityListPage = new ActivityListPage(driver);

          // transfer token from dapp
          await openDapp(driver, contractAddress);
          await testDapp.check_pageIsLoaded();
          await testDapp.clickTransferTokensWithoutGas();

          await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

          // check transaction details and confirm
          const expectedNetworkFee = '0.001';
          await tokenTransferRedesignedConfirmPage.check_pageIsLoaded(
            '1.5',
            symbol,
            expectedNetworkFee,
          );
          await tokenTransferRedesignedConfirmPage.clickConfirmButton();

          // in extension, check that transaction has completed correctly and is displayed in the activity list
          await driver.switchToWindowWithTitle(
            WINDOW_TITLES.ExtensionInFullScreenView,
          );

          await homePage.goToActivityList();
          await activityListPage.check_txAction(`Send ${symbol}`);
          await activityListPage.check_txAmountInActivity(
            valueWithSymbol('-1.5'),
          );

          // check token amount is correct after transaction
          await homePage.goToTokensTab();
          await assetListPage.check_tokenExistsInList(
            symbol,
            valueWithSymbol('8.5'),
          );
        },
      );
    });

    async function mocks(server: Mockttp) {
      return [await mockedSourcifyTokenSend(server)];
    }
  });
});
