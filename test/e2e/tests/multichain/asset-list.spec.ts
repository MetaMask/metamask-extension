import { strict as assert } from 'assert';
import { Suite } from 'mocha';
import { withFixtures } from '../../helpers';
import FixtureBuilder from '../../fixture-builder';
import { loginWithoutBalanceValidation } from '../../page-objects/flows/login.flow';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import SelectNetwork from '../../page-objects/pages/dialog/select-network';
import { SMART_CONTRACTS } from '../../seeder/smart-contracts';
import SendTokenPage from '../../page-objects/pages/send/send-token-page';
import AssetListPage from '../../page-objects/pages/home/asset-list';
import HomePage from '../../page-objects/pages/home/homepage';
import SwapPage from '../../page-objects/pages/swap/swap-page';
import { CHAIN_IDS } from '../../../../shared/constants/network';
import { Mockttp } from '../../mock-e2e';

const NETWORK_NAME_MAINNET = 'Ethereum Mainnet';
const LINEA_NAME_MAINNET = 'Linea Mainnet';
const POLYGON_NAME_MAINNET = 'Polygon';
const BALANCE_AMOUNT = '24.9978';

async function mockSwapSetup(mockServer: Mockttp) {
  return [
    await mockServer
      .forGet('https://min-api.cryptocompare.com/data/pricemulti')
      .withQuery({ fsyms: 'ETH,POL', tsyms: 'usd' })
      .thenCallback(() => ({
        statusCode: 200,
        json: { ETH: { USD: 2966.53 }, POL: { USD: 0.2322 } },
      })),
  ];
}
function buildFixtures(title: string, chainId: number = 1337) {
  return {
    fixtures: new FixtureBuilder()
      .withNetworkControllerOnPolygon()
      .withTokensControllerERC20({ chainId })
      .withEnabledNetworks({
        eip155: {
          [CHAIN_IDS.MAINNET]: true,
          [CHAIN_IDS.POLYGON]: true,
          [CHAIN_IDS.LINEA_MAINNET]: true,
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
    testSpecificMock: mockSwapSetup,
  };
}

describe('Multichain Asset List', function (this: Suite) {
  it('persists the preferred asset list preference when changing networks', async function () {
    await withFixtures(
      buildFixtures(this.test?.fullTitle() as string),
      async ({ driver, localNodes }) => {
        await loginWithoutBalanceValidation(driver);
        const homePage = new HomePage(driver);
        await homePage.check_localNodeBalanceIsDisplayed(localNodes[0]);
        const headerNavbar = new HeaderNavbar(driver);
        const selectNetworkDialog = new SelectNetwork(driver);
        const assetListPage = new AssetListPage(driver);
        await headerNavbar.clickSwitchNetworkDropDown();
        await selectNetworkDialog.selectNetworkName(NETWORK_NAME_MAINNET);
        await assetListPage.check_tokenItemNumber(4);
        await assetListPage.openNetworksFilter();
        await assetListPage.clickCurrentNetworkOption();
        await assetListPage.openNetworksFilterAndClickPopularNetworks();
        await assetListPage.check_tokenItemNumber(4);
        assert.equal(
          await assetListPage.getNetworksFilterLabel(),
          'Popular networks',
        );
      },
    );
  });
  it('allows clicking into the asset details page of native token on another network', async function () {
    await withFixtures(
      buildFixtures(this.test?.fullTitle() as string),
      async ({ driver, localNodes }) => {
        await loginWithoutBalanceValidation(driver);
        const homePage = new HomePage(driver);
        await homePage.check_localNodeBalanceIsDisplayed(localNodes[0]);
        const headerNavbar = new HeaderNavbar(driver);
        const selectNetworkDialog = new SelectNetwork(driver);
        const assetListPage = new AssetListPage(driver);
        await headerNavbar.clickSwitchNetworkDropDown();
        await selectNetworkDialog.selectNetworkName(NETWORK_NAME_MAINNET);
        await assetListPage.check_tokenItemNumber(4);
        await assetListPage.clickOnAsset('Ethereum');
        await assetListPage.check_buySellButtonIsPresent();
        await assetListPage.check_multichainTokenListButtonIsPresent();
      },
    );
  });
  it('switches networks when clicking on send for a token on another network', async function () {
    await withFixtures(
      buildFixtures(this.test?.fullTitle() as string, 1337),
      async ({ driver, localNodes }) => {
        await loginWithoutBalanceValidation(driver);
        const homePage = new HomePage(driver);
        await homePage.check_localNodeBalanceIsDisplayed(localNodes[0]);
        const headerNavbar = new HeaderNavbar(driver);
        const selectNetworkDialog = new SelectNetwork(driver);
        const assetListPage = new AssetListPage(driver);
        await headerNavbar.clickSwitchNetworkDropDown();
        await selectNetworkDialog.selectNetworkName(NETWORK_NAME_MAINNET);
        const sendPage = new SendTokenPage(driver);
        await assetListPage.check_tokenItemNumber(4);
        await assetListPage.clickOnAsset('Ethereum');
        await assetListPage.clickCoinSendButton();
        await sendPage.check_pageIsLoaded();
        await sendPage.fillRecipient(
          '0x2f318C334780961FB129D2a6c30D0763d9a5C970',
        );
        await sendPage.clickAssetPickerButton();
        const assetPickerItems = await sendPage.getAssetPickerItems();
        assert.equal(
          assetPickerItems.length,
          1,
          'Two assets should be shown in the asset picker',
        );
      },
    );
  });
  it('switches networks when clicking on swap for a token on another network', async function () {
    await withFixtures(
      buildFixtures(this.test?.fullTitle() as string, 137),
      async ({ driver, localNodes }) => {
        await loginWithoutBalanceValidation(driver);
        const homePage = new HomePage(driver);
        await homePage.check_localNodeBalanceIsDisplayed(localNodes[0]);
        const headerNavbar = new HeaderNavbar(driver);
        const selectNetworkDialog = new SelectNetwork(driver);
        const assetListPage = new AssetListPage(driver);
        const sendPage = new SendTokenPage(driver);
        await headerNavbar.clickSwitchNetworkDropDown();
        await selectNetworkDialog.selectNetworkName(NETWORK_NAME_MAINNET);
        await assetListPage.check_tokenItemNumber(5);
        await assetListPage.clickOnAsset('TST');
        await assetListPage.clickSwapButton();
        await sendPage.check_networkChange(POLYGON_NAME_MAINNET);
      },
    );
  });
  it('shows correct asset and balance when swapping on a different chain', async function () {
    await withFixtures(
      buildFixtures(this.test?.fullTitle() as string),
      async ({ driver, localNodes }) => {
        await loginWithoutBalanceValidation(driver);
        const homePage = new HomePage(driver);
        await homePage.check_localNodeBalanceIsDisplayed(localNodes[0]);
        const headerNavbar = new HeaderNavbar(driver);
        const assetListPage = new AssetListPage(driver);
        const selectNetworkDialog = new SelectNetwork(driver);
        const sendPage = new SendTokenPage(driver);
        const swapPage = new SwapPage(driver);
        await headerNavbar.clickSwitchNetworkDropDown();
        await selectNetworkDialog.selectNetworkName(LINEA_NAME_MAINNET);
        await assetListPage.check_tokenItemNumber(4);
        await assetListPage.clickOnAsset('Ethereum');
        await homePage.goToSwapTab();
        await sendPage.check_networkChange(NETWORK_NAME_MAINNET);
        await swapPage.check_prepareSwapBalanceMessage(BALANCE_AMOUNT);
      },
    );
  });
});
