import { HOMEPAGE_BALANCE_ASSERTION_TIMEOUT_MS } from '../../constants';
import { Driver } from '../../webdriver/driver';
import { login } from '../../page-objects/flows/login.flow';
import { switchToNetworkFromNetworkSelect } from '../../page-objects/flows/network.flow';
import AssetDetailsPage from '../../page-objects/pages/asset/asset-details';
import HomePage from '../../page-objects/pages/home/homepage';
import TokensTab from '../../page-objects/pages/home/tokens-tab';
import { withStellarFixtures } from '../stellar/fixtures/with-stellar-fixtures';
import { buildStellarFixture } from '../stellar/mocks/common-stellar';
import {
  STELLAR_NETWORK_NAME,
  STELLAR_USDC_ASSET_ID,
  XLM_BALANCE_DISPLAY,
  XLM_FIAT_DISPLAY,
} from '../stellar/mocks/stellar-constants';

/** Max wait for Stellar Snap balances to appear in the token list after refresh. */
const STELLAR_ASSET_LIST_TIMEOUT_MS = 30_000;

const ACTIVE_USDC_TRUSTLINE = {
  balance: '25.0000000',
  limit: '922337203685.4775807',
} as const;

describe('Stellar - Assets', function () {
  describe('Assets list', function () {
    it('XLM is the only asset and shows a 0 balance for an empty account', async function () {
      await withStellarFixtures(
        {
          horizonOptions: { unfunded: true },
          title: this.test?.fullTitle(),
        },
        async ({ driver }: { driver: Driver }) => {
          await login(driver, { validateBalance: false });
          await switchToNetworkFromNetworkSelect(driver, STELLAR_NETWORK_NAME);
          // Refresh re-hydrates the UI from background state so
          // asynchronously-fetched Snap balances appear reliably in the token
          // list.
          const homePage = new HomePage(driver);
          await homePage.refreshPage();

          const tokensTab = new TokensTab(driver);
          await tokensTab.checkTokenExistsInList('Stellar', '0 XLM', {
            timeout: STELLAR_ASSET_LIST_TIMEOUT_MS,
          });
          await tokensTab.checkOnlyAssetsArePresent(['Stellar']);
          await tokensTab.checkSendAndSwapButtonsArePresentAndEnabled();
        },
      );
    });

    it('shows funded XLM in the asset list', async function () {
      await withStellarFixtures(
        {
          title: this.test?.fullTitle(),
        },
        async ({ driver }: { driver: Driver }) => {
          await login(driver, { validateBalance: false });
          await switchToNetworkFromNetworkSelect(driver, STELLAR_NETWORK_NAME);
          const homePage = new HomePage(driver);
          await homePage.refreshPage();

          const tokensTab = new TokensTab(driver);
          await tokensTab.checkTokenExistsInList(
            'Stellar',
            XLM_BALANCE_DISPLAY,
            {
              timeout: STELLAR_ASSET_LIST_TIMEOUT_MS,
            },
          );
        },
      );
    });
  });

  describe('Homepage balance', function () {
    it('Just created Stellar account shows 0 XLM when native token is enabled', async function () {
      await withStellarFixtures(
        {
          horizonOptions: { unfunded: true },
          title: this.test?.fullTitle(),
        },
        async ({ driver }: { driver: Driver }) => {
          await login(driver, { validateBalance: false });
          const homePage = new HomePage(driver);
          await homePage.checkPageIsLoaded();
          await switchToNetworkFromNetworkSelect(driver, STELLAR_NETWORK_NAME);
          // Refresh re-hydrates the UI from background state so the
          // asynchronously-fetched Snap balance is shown reliably.
          await homePage.refreshPage();
          await homePage.checkExpectedBalanceIsDisplayed({
            expectedBalance: '0 XLM',
            timeout: HOMEPAGE_BALANCE_ASSERTION_TIMEOUT_MS,
          });
        },
      );
    });

    it('For a non 0 balance account - USD balance', async function () {
      await withStellarFixtures(
        {
          fixtures: buildStellarFixture({
            showNativeTokenAsMainBalanceDisabled: true,
          }).build(),
          title: this.test?.fullTitle(),
        },
        async ({ driver }: { driver: Driver }) => {
          await login(driver, { validateBalance: false });
          const homePage = new HomePage(driver);
          await homePage.checkPageIsLoaded();
          await switchToNetworkFromNetworkSelect(driver, STELLAR_NETWORK_NAME);
          await homePage.refreshPage();
          await homePage.checkExpectedBalanceIsDisplayed({
            expectedBalance: XLM_FIAT_DISPLAY,
            timeout: HOMEPAGE_BALANCE_ASSERTION_TIMEOUT_MS,
          });
        },
      );
    });

    it('For a non 0 balance account - XLM balance', async function () {
      await withStellarFixtures(
        {
          title: this.test?.fullTitle(),
        },
        async ({ driver }: { driver: Driver }) => {
          await login(driver, { validateBalance: false });
          const homePage = new HomePage(driver);
          await homePage.checkPageIsLoaded();
          await switchToNetworkFromNetworkSelect(driver, STELLAR_NETWORK_NAME);
          await homePage.refreshPage();
          await homePage.checkExpectedBalanceIsDisplayed({
            expectedBalance: XLM_BALANCE_DISPLAY,
            timeout: HOMEPAGE_BALANCE_ASSERTION_TIMEOUT_MS,
          });
        },
      );
    });
  });

  describe('Asset details', function () {
    it('shows active USDC trustline without Inactive badge or activate card', async function () {
      await withStellarFixtures(
        {
          horizonOptions: { usdc: ACTIVE_USDC_TRUSTLINE },
          title: this.test?.fullTitle(),
        },
        async ({ driver }: { driver: Driver }) => {
          await login(driver, { validateBalance: false });
          await switchToNetworkFromNetworkSelect(driver, STELLAR_NETWORK_NAME);
          const homePage = new HomePage(driver);
          await homePage.refreshPage();

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
      await withStellarFixtures(
        {
          // Funded XLM with no USDC trustline → activation required.
          title: this.test?.fullTitle(),
        },
        async ({ driver }: { driver: Driver }) => {
          await login(driver, { validateBalance: false });
          await switchToNetworkFromNetworkSelect(driver, STELLAR_NETWORK_NAME);
          const homePage = new HomePage(driver);
          await homePage.refreshPage();

          // Snap keyring balances omit classic trustlines with limit 0, so an
          // inactive USDC row never appears from Horizon alone. Deep-link the
          // USDC asset route; missing trustline metadata requires activation.
          const details = new AssetDetailsPage(driver);
          await details.navigateToAsset(STELLAR_USDC_ASSET_ID);
          await details.checkInactiveBadgeIsDisplayed();
          await details.checkActivateCardIsDisplayed();
        },
      );
    });
  });
});
