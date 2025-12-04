import { strict as assert } from 'assert';
import { Suite } from 'mocha';
import { withFixtures } from '../../helpers';
import FixtureBuilder from '../../fixtures/fixture-builder';
import { loginWithoutBalanceValidation } from '../../page-objects/flows/login.flow';
import { SMART_CONTRACTS } from '../../seeder/smart-contracts';
import SendTokenPage from '../../page-objects/pages/send/send-token-page';
import AssetListPage from '../../page-objects/pages/home/asset-list';
import { CHAIN_IDS } from '../../../../shared/constants/network';
import { Mockttp } from '../../mock-e2e';
import { switchToNetworkFromSendFlow } from '../../page-objects/flows/network.flow';

const NETWORK_NAME_MAINNET = 'Ethereum';

async function mockSetup(mockServer: Mockttp) {
  return [
    await mockServer
      .forGet('https://bridge.api.cx.metamask.io/networks/137/tokens')
      .thenCallback(() => ({
        statusCode: 200,
        json: [],
      })),
    await mockServer
      .forGet('https://bridge.api.cx.metamask.io/networks/137/topAssets')
      .thenCallback(() => ({
        statusCode: 200,
        json: [],
      })),
    await mockServer
      .forGet(
        'https://bridge.api.cx.metamask.io/networks/137/aggregatorMetadata',
      )
      .thenCallback(() => ({
        statusCode: 200,
        json: {},
      })),
  ];
}
function buildFixtures(title: string, chainId: number = 137) {
  return {
    fixtures: new FixtureBuilder()
      .withNetworkControllerOnPolygon()
      .withTokensControllerERC20({ chainId })
      .withEnabledNetworks({
        eip155: {
          [CHAIN_IDS.POLYGON]: true,
        },
      })
      .build(),
    localNodeOptions: [
      {
        type: 'anvil',
        options: {
          chainId: 1,
        },
      },
      {
        type: 'anvil',
        options: {
          port: 8546,
          chainId: 137,
        },
      },
    ],
    smartContract: SMART_CONTRACTS.HST,
    title,
    testSpecificMock: mockSetup,
  };
}

describe('Multichain Asset List', function (this: Suite) {
  it('allows clicking into the asset details page of native token on another network', async function () {
    await withFixtures(
      buildFixtures(this.test?.fullTitle() as string),
      async ({ driver }) => {
        await loginWithoutBalanceValidation(driver);
        const assetListPage = new AssetListPage(driver);
        await switchToNetworkFromSendFlow(driver, NETWORK_NAME_MAINNET);
        // Only Ethereum network is selected so only 1 token visible
        await assetListPage.checkTokenItemNumber(1);
        await assetListPage.clickOnAsset('Ether');
        await assetListPage.checkBuySellButtonIsPresent();
        await assetListPage.checkMultichainTokenListButtonIsPresent();
      },
    );
  });
  it('validate the tokens appear on send given network', async function () {
    await withFixtures(
      buildFixtures(this.test?.fullTitle() as string, 137),
      async ({ driver }) => {
        await loginWithoutBalanceValidation(driver);
        const assetListPage = new AssetListPage(driver);
        const sendPage = new SendTokenPage(driver);
        // Currently only polygon is selected, so only see polygon tokens
        // 1 native token (POL), and 1 ERC-20 (TST)
        await assetListPage.checkTokenItemNumber(2);
        await assetListPage.clickOnAsset('TST');
        await assetListPage.clickSendButton();
        await sendPage.checkPageIsLoaded();
        await sendPage.fillRecipient(
          '0x2f318C334780961FB129D2a6c30D0763d9a5C970',
        );
        await sendPage.clickAssetPickerButton();
        const assetPickerItems = await sendPage.getAssetPickerItems();
        assert.equal(
          assetPickerItems.length,
          2,
          'Two assets should be shown in the asset picker',
        );
      },
    );
  });
});
