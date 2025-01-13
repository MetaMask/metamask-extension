import { Mockttp } from 'mockttp';
import { mockedSourcifyTokenSend } from '../confirmations/transactions/erc20-token-send-redesign.spec';
import {
  withFixtures,
  defaultGanacheOptions,
  openDapp,
  WINDOW_TITLES,
  tempToggleSettingRedesignedTransactionConfirmations,
  unlockWallet,
} from '../../helpers';
import FixtureBuilder from '../../fixture-builder';
import { SMART_CONTRACTS } from '../../seeder/smart-contracts';
import ActivityListPage from '../../page-objects/pages/home/activity-list';
import AssetListPage from '../../page-objects/pages/home/asset-list';
import HomePage from '../../page-objects/pages/home/homepage';
import ConfirmTxPage from '../../page-objects/pages/send/confirm-tx-page';
import SendTokenPage from '../../page-objects/pages/send/send-token-page';
import TestDapp from '../../page-objects/pages/test-dapp';
import TokenTransferTransactionConfirmation from '../../page-objects/pages/confirmations/redesign/token-transfer-confirmation';

const recipientAddress = '0x2f318C334780961FB129D2a6c30D0763d9a5C970';

describe('Transfer custom tokens @no-mmi', function () {
  const smartContract = SMART_CONTRACTS.HST;
  const symbol = 'TST';
  const valueWithSymbol = (value: string) => `${value} ${symbol}`;

  describe('Old confirmation screens', function () {
    it('send custom tokens from extension customizing gas values', async function () {
      await withFixtures(
        {
          dapp: true,
          fixtures: new FixtureBuilder().withTokensControllerERC20().build(),
          ganacheOptions: defaultGanacheOptions,
          smartContract,
          title: this.test?.fullTitle(),
        },
        async ({ driver }) => {
          await unlockWallet(driver);

          await tempToggleSettingRedesignedTransactionConfirmations(driver);

          const homePage = new HomePage(driver);
          const assetListPage = new AssetListPage(driver);
          const sendTokenPage = new SendTokenPage(driver);
          const confirmTxPage = new ConfirmTxPage(driver);
          const activityListPage = new ActivityListPage(driver);

          await homePage.check_pageIsLoaded();

          await assetListPage.openTokenDetails(symbol);
          await assetListPage.clickSendButton();

          await sendTokenPage.check_pageIsLoaded();
          await sendTokenPage.fillRecipient(recipientAddress);
          await sendTokenPage.fillAmount('1');
          await sendTokenPage.clickContinueButton();

          // check transaction details
          const estimatedGasFee = '0.00008455';
          const totalAmount = `${valueWithSymbol('1')} + 0.00008455`;
          await confirmTxPage.check_pageIsLoaded(estimatedGasFee, totalAmount);

          // check function name and hex data details in hex tab
          await confirmTxPage.check_functionTypeAndHexData(
            'Transfer',
            '0xa9059cbb0000000000000000000000002f318c334780961fb129d2a6c30d0763d9a5c97',
          );

          // edit gas fee
          await confirmTxPage.switchToDetailsTab();
          await confirmTxPage.editGasFee('60000', '10');
          await confirmTxPage.confirmTx();

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
          ganacheOptions: defaultGanacheOptions,
          smartContract,
          title: this.test?.fullTitle(),
        },
        async ({ driver, contractRegistry }) => {
          const contractAddress = await contractRegistry.getContractAddress(
            smartContract,
          );
          await unlockWallet(driver);

          await tempToggleSettingRedesignedTransactionConfirmations(driver);

          const testDapp = new TestDapp(driver);
          const confirmTxPage = new ConfirmTxPage(driver);
          const activityListPage = new ActivityListPage(driver);
          const homepage = new HomePage(driver);
          const assetListPage = new AssetListPage(driver);

          // transfer token from dapp
          await openDapp(driver, contractAddress);
          await testDapp.check_pageIsLoaded();
          await testDapp.clickTransferTokens();

          await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

          const estimatedGasFee = '0.00010321';
          const totalAmount = `${valueWithSymbol('1.5')} + 0.00010321`;
          await confirmTxPage.check_pageIsLoaded(estimatedGasFee, totalAmount);

          // edit gas fee
          await confirmTxPage.switchToDetailsTab();
          await confirmTxPage.editGasFee('60000', '10');
          await confirmTxPage.confirmTx();

          // in extension, check that transaction has completed correctly and is displayed in the activity list
          await driver.switchToWindowWithTitle(
            WINDOW_TITLES.ExtensionInFullScreenView,
          );

          await homepage.goToActivityList();
          await activityListPage.check_txAction(`Send ${symbol}`);
          await activityListPage.check_txAmountInActivity(
            valueWithSymbol('-1.5'),
          );

          // check token amount is correct after transaction
          await homepage.goToTokensTab();
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
          ganacheOptions: defaultGanacheOptions,
          smartContract,
          title: this.test?.fullTitle(),
        },
        async ({ driver, contractRegistry }) => {
          const contractAddress = await contractRegistry.getContractAddress(
            smartContract,
          );

          await unlockWallet(driver);

          await tempToggleSettingRedesignedTransactionConfirmations(driver);

          const testDapp = new TestDapp(driver);
          const confirmTxPage = new ConfirmTxPage(driver);
          const activityListPage = new ActivityListPage(driver);
          const homepage = new HomePage(driver);
          const assetListPage = new AssetListPage(driver);

          // transfer token from dapp
          await openDapp(driver, contractAddress);
          await testDapp.check_pageIsLoaded();
          await testDapp.clickTransferTokensWithoutGas();

          await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

          const estimatedGasFee = '0.00103214';
          const totalAmount = `${valueWithSymbol('1.5')} + 0.00103214`;
          await confirmTxPage.check_pageIsLoaded(estimatedGasFee, totalAmount);
          await confirmTxPage.confirmTx();

          // in extension, check that transaction has completed correctly and is displayed in the activity list
          await driver.switchToWindowWithTitle(
            WINDOW_TITLES.ExtensionInFullScreenView,
          );

          await homepage.goToActivityList();
          await activityListPage.check_txAction(`Send ${symbol}`);
          await activityListPage.check_txAmountInActivity(
            valueWithSymbol('-1.5'),
          );

          // check token amount is correct after transaction
          await homepage.goToTokensTab();
          await assetListPage.check_tokenExistsInList(
            symbol,
            valueWithSymbol('8.5'),
          );
        },
      );
    });
  });

  describe('Redesigned confirmation screens', function () {
    it('send custom tokens from extension customizing gas values', async function () {
      await withFixtures(
        {
          dapp: true,
          fixtures: new FixtureBuilder().withTokensControllerERC20().build(),
          ganacheOptions: defaultGanacheOptions,
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
          await tokenTransferRedesignedConfirmPage.editGasFee('60000', '10');
          await tokenTransferRedesignedConfirmPage.confirmTx();

          // check that transaction has completed correctly and is displayed in the activity list
          await activityListPage.check_txAction(`Send ${symbol}`);
          await activityListPage.check_txAmountInActivity(`-1 ${symbol}`);
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
          ganacheOptions: defaultGanacheOptions,
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
          await tokenTransferRedesignedConfirmPage.editGasFee('60000', '10');
          await tokenTransferRedesignedConfirmPage.confirmTx();

          // in extension, check that transaction has completed correctly and is displayed in the activity list
          await driver.switchToWindowWithTitle(
            WINDOW_TITLES.ExtensionInFullScreenView,
          );

          await homePage.goToActivityList();
          await activityListPage.check_txAction(`Send ${symbol}`);
          await activityListPage.check_txAmountInActivity(`-1.5 ${symbol}`);

          // check token amount is correct after transaction
          await homePage.goToTokensTab();
          await assetListPage.check_tokenExistsInList(symbol, `8.5 ${symbol}`);
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
          ganacheOptions: defaultGanacheOptions,
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
          await tokenTransferRedesignedConfirmPage.confirmTx();

          // in extension, check that transaction has completed correctly and is displayed in the activity list
          await driver.switchToWindowWithTitle(
            WINDOW_TITLES.ExtensionInFullScreenView,
          );

          await homePage.goToActivityList();
          await activityListPage.check_txAction(`Send ${symbol}`);
          await activityListPage.check_txAmountInActivity(`-1.5 ${symbol}`);

          // check token amount is correct after transaction
          await homePage.goToTokensTab();
          await assetListPage.check_tokenExistsInList(symbol, `8.5 ${symbol}`);
        },
      );
    });

    async function mocks(server: Mockttp) {
      return [await mockedSourcifyTokenSend(server)];
    }
  });
});
