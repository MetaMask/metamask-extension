import { strict as assert } from 'assert';
import { Suite } from 'mocha';
import { Driver } from '../../webdriver/driver';
import { withFixtures } from '../../helpers';
import FixtureBuilder from '../../fixture-builder';
import { loginWithoutBalanceValidation, loginWithBalanceValidation } from '../../page-objects/flows/login.flow';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import SelectNetwork from '../../page-objects/pages/dialog/select-network';
import { SMART_CONTRACTS } from '../../seeder/smart-contracts';
import SendTokenPage from '../../page-objects/pages/send/send-token-page';
import AssetListPage from '../../page-objects/pages/home/asset-list';
import HomePage from '../../page-objects/pages/home/homepage';
import SwapPage from '../../page-objects/pages/swap/swap-page';

const NETWORK_NAME_MAINNET = 'Ethereum Mainnet';
const LINEA_NAME_MAINNET = 'Linea Mainnet';
const POLYGON_NAME_MAINNET = 'Polygon';
const BALANCE_AMOUNT = '24.9978';

function buildFixtures(title: string, chainId: number = 1337) {
  return {
    fixtures: new FixtureBuilder()
      .withPermissionControllerConnectedToTestDapp()
      .withNetworkControllerOnPolygon()
      .withTokensControllerERC20({ chainId })
      .build(),
    smartContract: SMART_CONTRACTS.HST,
    title,
  };
}

describe('Multichain Asset List', function (this: Suite) {
  it('persists the preferred asset list preference when changing networks', async function () {
    await withFixtures(
      buildFixtures(this.test?.fullTitle() as string),
      async ({ driver }: { driver: Driver }) => {
        await loginWithoutBalanceValidation(driver);
        const homePage = new HomePage(driver);
        await homePage.check_expectedBalanceIsDisplayed('24.9978', 'POL');
        const headerNavbar = new HeaderNavbar(driver);
        const selectNetworkDialog = new SelectNetwork(driver);
        const assetListPage = new AssetListPage(driver);
        await headerNavbar.clickSwitchNetworkDropDown();
        await selectNetworkDialog.selectNetworkName(NETWORK_NAME_MAINNET);
        await assetListPage.check_tokenItemNumber(4);
        await assetListPage.openNetworksFilter();
        await assetListPage.clickCurrentNetworkOption();
        await headerNavbar.clickSwitchNetworkDropDown();
        await selectNetworkDialog.selectNetworkName(LINEA_NAME_MAINNET);
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
      async ({ driver }: { driver: Driver }) => {
        await loginWithoutBalanceValidation(driver);
        const homePage = new HomePage(driver);
        await homePage.check_expectedBalanceIsDisplayed('24.9978', 'ETH');
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
      async ({ driver }: { driver: Driver }) => {
        await loginWithoutBalanceValidation(driver);
        const homePage = new HomePage(driver);
        await homePage.check_expectedBalanceIsDisplayed('24.9978', 'ETH');
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
      async ({ driver }: { driver: Driver }) => {
        await loginWithoutBalanceValidation(driver);
        const homePage = new HomePage(driver);
        await homePage.check_expectedBalanceIsDisplayed('24.9978', 'ETH');
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
      {
        fixtures: new FixtureBuilder().build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithBalanceValidation(driver);
        const homePage = new HomePage(driver);
        const headerNavbar = new HeaderNavbar(driver);
        const assetListPage = new AssetListPage(driver);
        const selectNetworkDialog = new SelectNetwork(driver);
        const sendPage = new SendTokenPage(driver);
        const swapPage = new SwapPage(driver);
        await headerNavbar.clickSwitchNetworkDropDown();
        await selectNetworkDialog.selectNetworkName(LINEA_NAME_MAINNET);
        await assetListPage.check_tokenItemNumber(1);
        await assetListPage.clickOnAsset('Ethereum');
        await homePage.goToSwapTab();
        await sendPage.check_networkChange(NETWORK_NAME_MAINNET);
        await swapPage.check_prepareSwapBalanceMessage(BALANCE_AMOUNT);
      },
    );
  });
});
