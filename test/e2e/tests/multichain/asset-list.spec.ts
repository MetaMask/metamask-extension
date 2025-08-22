import { strict as assert } from 'assert';
import { Suite } from 'mocha';
import { Driver } from '../../webdriver/driver';
import { withFixtures } from '../../helpers';
import FixtureBuilder from '../../fixture-builder';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';
import { SMART_CONTRACTS } from '../../seeder/smart-contracts';
import SendTokenPage from '../../page-objects/pages/send/send-token-page';
import AssetListPage from '../../page-objects/pages/home/asset-list';
import { switchToNetworkFromSendFlow } from '../../page-objects/flows/network.flow';

const POLYGON_NAME_MAINNET = 'Polygon';
const BALANCE_AMOUNT = '24.9956';

function buildFixtures(title: string, chainId: number = 1337) {
  return {
    fixtures: new FixtureBuilder()
      .withPermissionControllerConnectedToTestDapp()
      .withNetworkControllerOnPolygon()
      .withTokensControllerERC20({ chainId })
      .withEnabledNetworks({
        eip155: {
          [CHAIN_IDS.POLYGON]: true,
        },
      })
      .build(),
    smartContract: SMART_CONTRACTS.HST,
    title,
  };
}

describe('Multichain Asset List', function (this: Suite) {
  // Apply to all tests in this suite
  before(function () {
    if (!process.env.PORTFOLIO_VIEW) {
      this.skip();
    }
  });

  it('persists the preferred asset list preference when changing networks', async function () {
    await withFixtures(
      buildFixtures(this.test?.fullTitle() as string),
      async ({ driver }: { driver: Driver }) => {
        await loginWithBalanceValidation(driver);
        const assetListPage = new AssetListPage(driver);
        await switchToNetworkFromSendFlow(driver, 'Ethereum');
        await assetListPage.check_tokenItemNumber(3);
        await assetListPage.openNetworksFilter();
        await assetListPage.clickCurrentNetworkOption();
        await switchToNetworkFromSendFlow(driver, 'Linea');
        await assetListPage.waitUntilFilterLabelIs('Linea');
        await assetListPage.check_tokenItemNumber(1);
        assert.equal(await assetListPage.getNetworksFilterLabel(), 'Linea');
      },
    );
  });
  it('allows clicking into the asset details page of native token on another network', async function () {
    await withFixtures(
      buildFixtures(this.test?.fullTitle() as string),
      async ({ driver }: { driver: Driver }) => {
        await loginWithBalanceValidation(driver);
        const assetListPage = new AssetListPage(driver);
        await switchToNetworkFromSendFlow(driver, NETWORK_NAME_MAINNET);
        // Only Ethereum network is selected so only 1 token visible
        await assetListPage.checkTokenItemNumber(1);
        await assetListPage.clickOnAsset('Ethereum');
        await assetListPage.checkBuySellButtonIsPresent();
        await assetListPage.checkMultichainTokenListButtonIsPresent();
      },
    );
  });
  it('switches networks when clicking on send for a token on another network', async function () {
    await withFixtures(
      buildFixtures(this.test?.fullTitle() as string, 137),
      async ({ driver }: { driver: Driver }) => {
        await loginWithBalanceValidation(driver);
        const assetListPage = new AssetListPage(driver);
        await switchToNetworkFromSendFlow(driver, 'Ethereum');
        const sendPage = new SendTokenPage(driver);
        // Currently only polygon is selected, so only see polygon tokens
        // 1 native token (POL), and 1 ERC-20 (TST)
        await assetListPage.checkTokenItemNumber(2);
        await assetListPage.clickOnAsset('TST');
        await driver.clickElement('[data-testid="eth-overview-send"]');
        await sendPage.check_networkChange(POLYGON_NAME_MAINNET);
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
      buildFixtures(this.test?.fullTitle() as string, 137),
      async ({ driver }: { driver: Driver }) => {
        await loginWithBalanceValidation(driver);
        const assetListPage = new AssetListPage(driver);
        await switchToNetworkFromSendFlow(driver, 'Ethereum');
        await assetListPage.check_tokenItemNumber(4);
        await assetListPage.clickOnAsset('TST');
        await driver.clickElement('.mm-box > button:nth-of-type(3)');
        const toastTextElement = await driver.findElement('.toast-text');
        const toastText = await toastTextElement.getText();
        assert.equal(
          toastText,
          `You're now using ${POLYGON_NAME_MAINNET}`,
          'Toast text is correct',
        );
      },
    );
  });
  it('shows correct asset and balance when swapping on a different chain', async function () {
    await withFixtures(
      buildFixtures(this.test?.fullTitle() as string),
      async ({ driver }: { driver: Driver }) => {
        await loginWithBalanceValidation(driver);
        const assetListPage = new AssetListPage(driver);
        await switchToNetworkFromSendFlow(driver, 'Linea');
        await assetListPage.check_tokenItemNumber(3);
        await assetListPage.clickOnAsset('Ethereum');

        const swapButton = await driver.findElement(
          '[data-testid="token-overview-button-swap"]',
        );
        await swapButton.click();
        const toastTextElement = await driver.findElement('.toast-text');
        const toastText = await toastTextElement.getText();
        assert.equal(
          toastText,
          `You're now using Ethereum Mainnet`,
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
