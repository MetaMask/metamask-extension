/**
 * Send ERC20 - Mainnet with Preloaded State
 *
 * Tests sending tokens on mainnet with a preloaded wallet state (DAI).
 * This covers the mainnet-specific flow that requires pre-seeded token balances.
 */

import { withFixtures } from '../../helpers';
import FixtureBuilder from '../../fixtures/fixture-builder';
import ActivityListPage from '../../page-objects/pages/home/activity-list';
import AssetListPage from '../../page-objects/pages/home/asset-list';
import HomePage from '../../page-objects/pages/home/homepage';
import SendPage from '../../page-objects/pages/send/send-page';
import TokenOverviewPage from '../../page-objects/pages/token-overview-page';
import TokenTransferTransactionConfirmation from '../../page-objects/pages/confirmations/token-transfer-confirmation';
import { login } from '../../page-objects/flows/login.flow';

const DAI_ADDRESS = '0x6b175474e89094c44da98b954eedeac495271d0f';

const MAINNET_TOKEN_LIST_ENTRY = {
  [DAI_ADDRESS]: {
    name: 'Dai Stablecoin',
    symbol: 'DAI',
    decimals: 18,
    address: DAI_ADDRESS,
    occurrences: 1,
    aggregators: [],
    iconUrl: '',
  },
};

describe('Send ERC20 - Mainnet', function () {
  it('sends DAI with preloaded state', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder()
          .withNetworkControllerOnMainnet()
          .withEnabledNetworks({
            eip155: {
              '0x1': true,
            },
          })
          .withTokenListController({
            tokensChainsCache: {
              '0x1': {
                timestamp: Date.now(),
                data: MAINNET_TOKEN_LIST_ENTRY,
              },
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
        await login(driver, { localNode: localNodes[0] });

        const homePage = new HomePage(driver);
        const assetListPage = new AssetListPage(driver);
        await homePage.checkPageIsLoaded();
        await assetListPage.importTokenBySearch('DAI');
        await assetListPage.clickOnAsset('Dai Stablecoin');

        // Send DAI
        const tokenOverviewPage = new TokenOverviewPage(driver);
        await tokenOverviewPage.checkPageIsLoaded();
        await tokenOverviewPage.clickSend();

        const sendPage = new SendPage(driver);
        await sendPage.fillRecipient(
          '0x5cfe73b6021e818b776b421b1c4db2474086a7e1',
        );
        await sendPage.fillAmount('10');
        await sendPage.pressContinueButton();

        // Check transaction in the Activity list
        const tokenTransferTransactionConfirmation =
          new TokenTransferTransactionConfirmation(driver);
        await tokenTransferTransactionConfirmation.checkWalletInitiatedHeadingTitle();
        await tokenTransferTransactionConfirmation.checkNetworkParagraph();
        await tokenTransferTransactionConfirmation.checkNetworkFeeParagraph();

        await tokenTransferTransactionConfirmation.clickFooterConfirmButton();
        await homePage.checkPageIsLoaded();
        await homePage.goToActivityList();
        const activityList = new ActivityListPage(driver);
        await activityList.checkConfirmedTxNumberDisplayedInActivity();
        await activityList.checkTxAmountInActivity('-10 DAI');
      },
    );
  });
});
