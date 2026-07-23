/**
 * Send ERC20 - Mainnet with Preloaded State
 *
 * Tests sending tokens on mainnet with a preloaded wallet state (DAI).
 * This covers the mainnet-specific flow that requires pre-seeded token balances.
 */

import { Mockttp } from 'mockttp';
import { withFixtures } from '../../helpers';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import ActivityTab from '../../page-objects/pages/home/activity-tab';
import TokensTab from '../../page-objects/pages/home/tokens-tab';
import HomePage from '../../page-objects/pages/home/homepage';
import SendPage from '../../page-objects/pages/send/send-page';
import TokenOverviewPage from '../../page-objects/pages/token-overview-page';
import TokenTransferTransactionConfirmation from '../../page-objects/pages/confirmations/token-transfer-confirmation';
import { login } from '../../page-objects/flows/login.flow';
import { NETWORK_CLIENT_ID } from '../../constants';
import { MAINNET_DISPLAY_NAME } from '../../../../shared/constants/network';

const DAI_CAIP_ASSET =
  'eip155:1/erc20:0x6B175474E89094C44Da98b954EedeAC495271d0F';

async function mockSpotPriceV3ForDai(mockServer: Mockttp) {
  return [
    await mockServer
      .forGet(/https:\/\/price\.api\.cx\.metamask\.io\/v3\/spot-prices/u)
      .always()
      .thenCallback((request) => {
        const url = new URL(request.url);
        const assetIds = url.searchParams.get('assetIds') ?? '';
        const result: Record<string, unknown> = {};
        if (
          assetIds
            .toLowerCase()
            .includes('0x6b175474e89094c44da98b954eedeac495271d0f')
        ) {
          result[DAI_CAIP_ASSET] = {
            price: 0.999,
            currency: 'usd',
            pricePercentChange1d: 0,
          };
        }
        return { statusCode: 200, json: result };
      }),
    await mockServer
      .forGet(/^https:\/\/token\.api\.cx\.metamask\.io\/tokens\/search/u)
      .always()
      .thenCallback((request) => {
        const url = new URL(request.url);
        const query = (url.searchParams.get('query') ?? '')
          .trim()
          .toLowerCase();
        const data =
          query === 'dai'
            ? [
                {
                  assetId: DAI_CAIP_ASSET,
                  symbol: 'DAI',
                  name: 'Dai Stablecoin',
                  decimals: 18,
                },
              ]
            : [];
        return {
          statusCode: 200,
          json: {
            data,
            count: data.length,
            totalCount: data.length,
            pageInfo: { hasNextPage: false, endCursor: '' },
          },
        };
      }),
  ];
}

describe('Send ERC20 - Mainnet', function () {
  it('sends DAI with preloaded state', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2()
          .withSelectedNetwork(NETWORK_CLIENT_ID.MAINNET)
          .withEnabledNetworks({
            eip155: {
              '0x1': true,
            },
          })
          .build(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockSpotPriceV3ForDai,
        manifestFlags: {
          remoteFeatureFlags: {
            extensionUxTokenManagementFilter: true,
          },
        },
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
        const tokensTab = new TokensTab(driver);
        await tokensTab.importTokenBySearch({
          tokenName: 'DAI',
          networkName: MAINNET_DISPLAY_NAME,
        });
        await tokensTab.dismissTokenImportedMessage();
        await tokensTab.clickOnAsset('Dai Stablecoin');

        // Send DAI
        const tokenOverviewPage = new TokenOverviewPage(driver);
        await tokenOverviewPage.checkPageIsLoaded();
        await tokenOverviewPage.clickSend();

        const sendPage = new SendPage(driver);
        await sendPage.fillRecipient({
          recipientAddress: '0x5cfe73b6021e818b776b421b1c4db2474086a7e1',
        });
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
        const activityTab = new ActivityTab(driver);
        await activityTab.checkConfirmedTxNumberDisplayedInActivity();
        await activityTab.checkTxAmountInActivity('-10 DAI');
      },
    );
  });
});
