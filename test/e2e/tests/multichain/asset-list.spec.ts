import { strict as assert } from 'assert';
import { Suite } from 'mocha';
import { Driver } from '../../webdriver/driver';
import { withFixtures, defaultGanacheOptions } from '../../helpers';
import { Ganache } from '../../seeder/ganache';
import FixtureBuilder from '../../fixture-builder';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import SelectNetwork from '../../page-objects/pages/dialog/select-network';
import { SMART_CONTRACTS } from '../../seeder/smart-contracts';
import SendTokenPage from '../../page-objects/pages/send/send-token-page';
import AssetListPage from '../../page-objects/pages/asset-list';

const NETWORK_NAME_MAINNET = 'Ethereum Mainnet';
const LINEA_NAME_MAINNET = 'Linea Mainnet';
const LOCALHOST = 'Localhost 8545';
const BALANCE_AMOUNT = '24.9956';

function buildFixtures(title: string) {
  return {
    fixtures: new FixtureBuilder()
      .withPermissionControllerConnectedToTestDapp()
      .withTokensControllerERC20()
      .build(),
    ganacheOptions: defaultGanacheOptions,
    smartContract: SMART_CONTRACTS.HST,
    title,
  };
}

describe('Multichain Asset List', function (this: Suite) {
  if (!process.env.PORTFOLIO_VIEW) {
    return;
  }

  it('persists the preferred asset list preference when changing networks', async function () {
    await withFixtures(
      buildFixtures(this.test?.fullTitle() as string),
      async ({
        driver,
        ganacheServer,
      }: {
        driver: Driver;
        ganacheServer?: Ganache;
      }) => {
        await loginWithBalanceValidation(driver, ganacheServer);
        const headerNavbar = new HeaderNavbar(driver);
        const selectNetworkDialog = new SelectNetwork(driver);
        const assetListPage = new AssetListPage(driver);
        await headerNavbar.clickSwitchNetworkDropDown();
        await selectNetworkDialog.selectNetworkName(NETWORK_NAME_MAINNET);
        await assetListPage.waitUntilAssetListHasItems(2);
        await assetListPage.openNetworksFilter();
        await assetListPage.clickCurrentNetworkOption();
        await headerNavbar.clickSwitchNetworkDropDown();
        await selectNetworkDialog.selectNetworkName(LINEA_NAME_MAINNET);
        await assetListPage.waitUntilFilterLabelIs(LINEA_NAME_MAINNET);
        await assetListPage.waitUntilAssetListHasItems(1);
        assert.equal(
          await assetListPage.getNetworksFilterLabel(),
          LINEA_NAME_MAINNET,
        );
      },
    );
  });
  it('allows clicking into the asset details page of native token on another network', async function () {
    await withFixtures(
      buildFixtures(this.test?.fullTitle() as string),
      async ({
        driver,
        ganacheServer,
      }: {
        driver: Driver;
        ganacheServer?: Ganache;
      }) => {
        await loginWithBalanceValidation(driver, ganacheServer);
        const headerNavbar = new HeaderNavbar(driver);
        const selectNetworkDialog = new SelectNetwork(driver);
        const assetListPage = new AssetListPage(driver);
        await headerNavbar.clickSwitchNetworkDropDown();
        await selectNetworkDialog.selectNetworkName(NETWORK_NAME_MAINNET);
        await assetListPage.waitUntilAssetListHasItems(2);
        await driver.clickElement('.multichain-token-list-item');
        const coinOverviewElement = await driver.findElement(
          '[data-testid="coin-overview-buy"]',
        );
        const multichainTokenListButton = await driver.findElement(
          '[data-testid="multichain-token-list-button"]',
        );
        assert.ok(coinOverviewElement, 'coin-overview-buy is present');
        assert.ok(
          multichainTokenListButton,
          'multichain-token-list-button is present',
        );
      },
    );
  });
  it('switches networks when clicking on send for a token on another network', async function () {
    await withFixtures(
      buildFixtures(this.test?.fullTitle() as string),
      async ({
        driver,
        ganacheServer,
      }: {
        driver: Driver;
        ganacheServer?: Ganache;
      }) => {
        await loginWithBalanceValidation(driver, ganacheServer);
        const headerNavbar = new HeaderNavbar(driver);
        const selectNetworkDialog = new SelectNetwork(driver);
        const assetListPage = new AssetListPage(driver);
        await headerNavbar.clickSwitchNetworkDropDown();
        await selectNetworkDialog.selectNetworkName(NETWORK_NAME_MAINNET);
        const sendPage = new SendTokenPage(driver);
        await assetListPage.waitUntilAssetListHasItems(2);
        await assetListPage.clickOnAsset('TST');
        await driver.clickElement('[data-testid="eth-overview-send"]');
        await sendPage.check_networkChange(LOCALHOST);
        await sendPage.check_pageIsLoaded();
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
  it('switches networks when clicking on swap for a token on another network', async function () {
    await withFixtures(
      buildFixtures(this.test?.fullTitle() as string),
      async ({
        driver,
        ganacheServer,
      }: {
        driver: Driver;
        ganacheServer?: Ganache;
      }) => {
        await loginWithBalanceValidation(driver, ganacheServer);
        const headerNavbar = new HeaderNavbar(driver);
        const selectNetworkDialog = new SelectNetwork(driver);
        const assetListPage = new AssetListPage(driver);
        await headerNavbar.clickSwitchNetworkDropDown();
        await selectNetworkDialog.selectNetworkName(NETWORK_NAME_MAINNET);
        await assetListPage.waitUntilAssetListHasItems(2);
        await assetListPage.clickOnAsset('TST');
        await driver.clickElement('.mm-box > button:nth-of-type(3)');
        const toastTextElement = await driver.findElement('.toast-text');
        const toastText = await toastTextElement.getText();
        assert.equal(
          toastText,
          `You're now using ${LOCALHOST}`,
          'Toast text is correct',
        );
      },
    );
  });
  it('shows correct asset and balance when swapping on a different chain', async function () {
    await withFixtures(
      buildFixtures(this.test?.fullTitle() as string),
      async ({
        driver,
        ganacheServer,
      }: {
        driver: Driver;
        ganacheServer?: Ganache;
      }) => {
        await loginWithBalanceValidation(driver, ganacheServer);
        const headerNavbar = new HeaderNavbar(driver);
        const assetListPage = new AssetListPage(driver);
        const selectNetworkDialog = new SelectNetwork(driver);
        await headerNavbar.clickSwitchNetworkDropDown();
        await selectNetworkDialog.selectNetworkName(LINEA_NAME_MAINNET);
        await assetListPage.waitUntilAssetListHasItems(2);

        await assetListPage.clickOnAsset('Ethereum');

        const swapButton = await driver.findElement(
          '[data-testid="token-overview-button-swap"]',
        );
        await swapButton.click();
        const toastTextElement = await driver.findElement('.toast-text');
        const toastText = await toastTextElement.getText();
        assert.equal(
          toastText,
          `You're now using ${LOCALHOST}`,
          'Toast text is correct',
        );
        const balanceMessageElement = await driver.findElement(
          '.prepare-swap-page__balance-message',
        );
        const balanceMessage = await balanceMessageElement.getText();
        assert.equal(
          balanceMessage.replace('Max', '').trim(),
          `Balance: ${BALANCE_AMOUNT}`,
          'Balance message is correct',
        );
      },
    );
  });
});
