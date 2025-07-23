import { withFixtures } from '../../helpers';
import FixtureBuilder from '../../fixture-builder';
import ActivityListPage from '../../page-objects/pages/home/activity-list';
import AssetListPage from '../../page-objects/pages/home/asset-list';
import HomePage from '../../page-objects/pages/home/homepage';
import SendTokenPage from '../../page-objects/pages/send/send-token-page';
import TokenOverviewPage from '../../page-objects/pages/token-overview-page';
import TokenTransferTransactionConfirmation from '../../page-objects/pages/confirmations/redesign/token-transfer-confirmation';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';

describe('Send ERC20', function () {
  it('should send DAI', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder()
          .withNetworkControllerOnMainnet()
          .withTokensController({
            allTokens: {
              '0x1': {
                '0x5cfe73b6021e818b776b421b1c4db2474086a7e1': [
                  {
                    address: '0x6b175474e89094c44da98b954eedeac495271d0f',
                    symbol: 'DAI',
                    decimals: 18,
                    isERC721: false,
                    aggregators: [],
                  },
                ],
              },
            },
          })
          .withEnabledNetworks({
            eip155: {
              '0x1': true,
            },
          })
          .build(),
        title: this.test?.fullTitle(),
        localNodeOptions: [
          {
            type: 'anvil',
            options: {
              chainId: 1,
              loadState: './test/e2e/seeder/network-states/with50Dai.json',
            },
          },
        ],
      },
      async ({ driver, localNodes }) => {
        await loginWithBalanceValidation(driver, localNodes[0]);

        const homePage = new HomePage(driver);
        const assetListPage = new AssetListPage(driver);
        await homePage.check_pageIsLoaded();
        await assetListPage.clickOnAsset('DAI');

        // Send DAI
        const tokenOverviewPage = new TokenOverviewPage(driver);
        await tokenOverviewPage.check_pageIsLoaded();
        await tokenOverviewPage.clickSend();

        const sendTokenPage = new SendTokenPage(driver);
        await sendTokenPage.check_pageIsLoaded();
        await sendTokenPage.fillRecipient(
          '0x5cfe73b6021e818b776b421b1c4db2474086a7e1',
        );
        await sendTokenPage.fillAmount('10');
        await sendTokenPage.goToNextScreen();

        // Check transaction in the Activity list
        const tokenTransferTransactionConfirmation =
          new TokenTransferTransactionConfirmation(driver);
        await tokenTransferTransactionConfirmation.check_walletInitiatedHeadingTitle();
        await tokenTransferTransactionConfirmation.check_networkParagraph();
        await tokenTransferTransactionConfirmation.check_networkFeeParagraph();

        await tokenTransferTransactionConfirmation.clickFooterConfirmButton();
        await homePage.check_pageIsLoaded();
        const activityList = new ActivityListPage(driver);
        await activityList.check_confirmedTxNumberDisplayedInActivity();
        await activityList.check_txAmountInActivity('-10 DAI');
      },
    );
  });
});
