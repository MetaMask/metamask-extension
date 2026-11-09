import { Suite } from 'mocha';
import type { CaipAssetType } from '@metamask/utils';
import { withFixtures } from '../../helpers';
import { Driver } from '../../webdriver/driver';
import { login } from '../../page-objects/flows/login.flow';
import { selectStellarNetwork } from '../../page-objects/flows/stellar-network.flow';
import AssetDetailsPage from '../../page-objects/pages/asset/asset-details';
import HomePage from '../../page-objects/pages/home/homepage';
import TokensTab from '../../page-objects/pages/home/tokens-tab';
import { buildAssetRoutePath } from '../../../../shared/lib/asset-route';
import {
  STELLAR_USDC_ASSET_ID,
  XLM_BALANCE_DISPLAY,
  buildStellarFixture,
  mockStellarApisZeroBalance,
  mockStellarApisWithActiveUsdcTrustline,
  mockStellarApisWithInactiveUsdcTrustline,
  stellarFixtureOptions,
} from './mocks/common-stellar';

/** Max wait for Stellar Snap balances to appear in the token list after refresh. */
const STELLAR_ASSET_LIST_TIMEOUT_MS = 30_000;

function stellarAssetsTestConfig(
  testSpecificMock: typeof mockStellarApisZeroBalance,
  title?: string,
) {
  return stellarFixtureOptions({
    fixtures: buildStellarFixture().build(),
    testSpecificMock,
    title,
  });
}

async function landOnStellarHome(driver: Driver): Promise<HomePage> {
  await login(driver, { validateBalance: false });
  await selectStellarNetwork(driver);
  // Refresh re-hydrates the UI from background state so asynchronously-fetched
  // Snap balances appear reliably in the token list.
  await driver.refresh();
  const homePage = new HomePage(driver);
  await homePage.checkPageIsLoaded();
  return homePage;
}

describe('Stellar - Assets', function (this: Suite) {
  this.timeout(180_000);

  it('XLM is the only asset and shows a 0 balance for an empty account', async function () {
    await withFixtures(
      stellarAssetsTestConfig(
        mockStellarApisZeroBalance,
        this.test?.fullTitle(),
      ),
      async ({ driver }: { driver: Driver }) => {
        await landOnStellarHome(driver);

        const tokensTab = new TokensTab(driver);
        await tokensTab.checkTokenExistsInList('Stellar', '0 XLM', {
          timeout: STELLAR_ASSET_LIST_TIMEOUT_MS,
        });
        await tokensTab.checkSendAndSwapButtonsArePresentAndEnabled();
      },
    );
  });

  it('shows funded XLM in the asset list', async function () {
    await withFixtures(
      stellarAssetsTestConfig(
        mockStellarApisWithActiveUsdcTrustline,
        this.test?.fullTitle(),
      ),
      async ({ driver }: { driver: Driver }) => {
        await landOnStellarHome(driver);

        const tokensTab = new TokensTab(driver);
        await tokensTab.checkTokenExistsInList('Stellar', XLM_BALANCE_DISPLAY, {
          timeout: STELLAR_ASSET_LIST_TIMEOUT_MS,
        });
      },
    );
  });

  it('shows active USDC trustline without Inactive badge or activate card', async function () {
    await withFixtures(
      stellarAssetsTestConfig(
        mockStellarApisWithActiveUsdcTrustline,
        this.test?.fullTitle(),
      ),
      async ({ driver }: { driver: Driver }) => {
        await landOnStellarHome(driver);

        const tokensTab = new TokensTab(driver);
        await tokensTab.checkTokenExistsInList('USD Coin', '25 USDC', {
          timeout: STELLAR_ASSET_LIST_TIMEOUT_MS,
        });
        await tokensTab.clickOnAsset('USD Coin');

        const details = new AssetDetailsPage(driver);
        await details.checkPageIsLoaded();
        await details.checkInactiveBadgeIsAbsent();
        await details.checkActivateCardIsAbsent();
      },
    );
  });

  it('shows inactive USDC trustline status (Inactive badge + activate card)', async function () {
    await withFixtures(
      stellarAssetsTestConfig(
        mockStellarApisWithInactiveUsdcTrustline,
        this.test?.fullTitle(),
      ),
      async ({ driver }: { driver: Driver }) => {
        await landOnStellarHome(driver);

        // Snap keyring balances omit classic trustlines with limit 0, so an
        // inactive USDC row never appears from Horizon alone. Deep-link the
        // USDC asset route (full navigation so createHashRouter mounts on it);
        // missing trustline metadata requires activation.
        const assetPath = buildAssetRoutePath(
          STELLAR_USDC_ASSET_ID as CaipAssetType,
        );
        const currentUrl = await driver.getCurrentUrl();
        const baseUrl = currentUrl.replace(/#.*$/u, '');
        await driver.driver.get(`${baseUrl}#${assetPath}`);
        await driver.waitForControllersLoaded();

        const details = new AssetDetailsPage(driver);
        await details.checkPageIsLoaded();
        await details.checkInactiveBadgeIsDisplayed();
        await details.checkActivateCardIsDisplayed();
      },
    );
  });
});
