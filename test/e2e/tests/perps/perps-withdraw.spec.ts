/**
 * Perps Withdraw E2E tests
 *
 * These tests cover the Withdraw page: navigation, form validation,
 * summary row visibility, and cancel/back navigation.
 *
 * PREREQUISITE: All tests below require PERPS_ENABLED=true in the extension build
 * so the background PerpsController is included and can service `perpsInit` RPC calls.
 * Set PERPS_ENABLED=true in .metamaskrc (see .metamaskrc.dist) before running locally.
 *
 * The Withdraw page is accessible from Perps Home → balance dropdown → Withdraw.
 * Uses {@link WS_USER_WITH_FUNDED_ACCOUNT} so the balance bar leaves the loading skeleton.
 * Cancel and the header back control both navigate to wallet home (`/`); tests re-open
 * the Perps tab before asserting the balance section.
 *
 * Successful submit is covered by a dedicated test: it relies on `mock-e2e.js` returning a
 * funded `clearinghouseState` for the default E2E account on POST `/info` (same balance as
 * {@link WS_USER_WITH_FUNDED_ACCOUNT}) and a successful `withdraw3` response on `/exchange`.
 */
import { Suite } from 'mocha';
import { withFixtures } from '../../helpers';
import { Driver } from '../../webdriver/driver';
import { login } from '../../page-objects/flows/login.flow';
import { PerpsHomePage } from '../../page-objects/pages/perps/perps-home-page';
import { PerpsWithdrawPage } from '../../page-objects/pages/perps/perps-withdraw-page';
import { getPerpsConfigEligible } from './perps-fixture-config';
import { WS_USER_WITH_FUNDED_ACCOUNT } from './mocks/websocketPositionMocks';

const withdrawFixtures = (title?: string) => ({
  ...getPerpsConfigEligible(title),
  perpsWebSocketSpecificMocks: WS_USER_WITH_FUNDED_ACCOUNT,
});

describe('Perps Withdraw', function (this: Suite) {
  this.timeout(120000);

  it('withdraw page loads with header and summary rows visible', async function () {
    await withFixtures(
      {
        ...withdrawFixtures(this.test?.fullTitle()),
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver, { validateBalance: false });

        const perpsHomePage = new PerpsHomePage(driver);
        await perpsHomePage.navigateToPerpsHome();
        await perpsHomePage.checkPageIsLoaded();
        await perpsHomePage.waitForBalanceSection();
        await perpsHomePage.clickWithdraw();

        const withdrawPage = new PerpsWithdrawPage(driver);
        await withdrawPage.checkPageIsLoaded();
        await withdrawPage.waitForSummaryRows();
      },
    );
  });

  it('submits a valid withdrawal and shows success toast on home', async function () {
    await withFixtures(
      {
        ...withdrawFixtures(this.test?.fullTitle()),
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver, { validateBalance: false });

        const perpsHomePage = new PerpsHomePage(driver);
        await perpsHomePage.navigateToPerpsHome();
        await perpsHomePage.checkPageIsLoaded();
        await perpsHomePage.waitForBalanceSection();
        await perpsHomePage.clickWithdraw();

        const withdrawPage = new PerpsWithdrawPage(driver);
        await withdrawPage.checkPageIsLoaded();
        await withdrawPage.waitForSummaryRows();
        await withdrawPage.fillAmount('50');
        await withdrawPage.clickSubmit();
        await withdrawPage.waitForWithdrawSubmittedToast();
      },
    );
  });

  it('withdraw submit button is disabled when amount is zero', async function () {
    await withFixtures(
      {
        ...withdrawFixtures(this.test?.fullTitle()),
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver, { validateBalance: false });

        const perpsHomePage = new PerpsHomePage(driver);
        await perpsHomePage.navigateToPerpsHome();
        await perpsHomePage.checkPageIsLoaded();
        await perpsHomePage.waitForBalanceSection();
        await perpsHomePage.clickWithdraw();

        const withdrawPage = new PerpsWithdrawPage(driver);
        await withdrawPage.checkPageIsLoaded();
        // Default amount is 0 — submit should be disabled
        await withdrawPage.assertSubmitDisabled();
      },
    );
  });

  it('shows validation error when withdrawal amount exceeds available balance', async function () {
    await withFixtures(
      {
        ...withdrawFixtures(this.test?.fullTitle()),
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver, { validateBalance: false });

        const perpsHomePage = new PerpsHomePage(driver);
        await perpsHomePage.navigateToPerpsHome();
        await perpsHomePage.checkPageIsLoaded();
        await perpsHomePage.waitForBalanceSection();
        await perpsHomePage.clickWithdraw();

        const withdrawPage = new PerpsWithdrawPage(driver);
        await withdrawPage.checkPageIsLoaded();
        await withdrawPage.fillAmount('99999');
        await withdrawPage.waitForValidationMessage('exceeds');
        await withdrawPage.assertSubmitDisabled();
      },
    );
  });
});
