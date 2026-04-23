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
 * It requires an eligible user (isEligible: true) to reach the page without geo-block.
 */
import { Suite } from 'mocha';
import { withFixtures } from '../../helpers';
import { Driver } from '../../webdriver/driver';
import { login } from '../../page-objects/flows/login.flow';
import { PerpsHomePage } from '../../page-objects/pages/perps/perps-home-page';
import { PerpsWithdrawPage } from '../../page-objects/pages/perps/perps-withdraw-page';
import { getPerpsConfigEligible } from './helpers';

describe('Perps Withdraw', function (this: Suite) {
  this.timeout(120000);

  // eslint-disable-next-line mocha/no-skipped-tests -- Requires PERPS_ENABLED=true in test build; see web-socket-connection.spec.ts
  it.skip('withdraw page loads with header and summary rows visible', async function () {
    await withFixtures(
      {
        ...getPerpsConfigEligible(this.test?.fullTitle()),
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver, { validateBalance: false });

        const perpsHomePage = new PerpsHomePage(driver);
        await perpsHomePage.navigateToPerpsHome();
        await perpsHomePage.waitForBalanceSection();
        await perpsHomePage.clickWithdraw();

        const withdrawPage = new PerpsWithdrawPage(driver);
        await withdrawPage.checkPageIsLoaded();
        await withdrawPage.waitForSummaryRows();
      },
    );
  });

  // eslint-disable-next-line mocha/no-skipped-tests -- Requires PERPS_ENABLED=true in test build; see web-socket-connection.spec.ts
  it.skip('withdraw submit button is disabled when amount is zero', async function () {
    await withFixtures(
      {
        ...getPerpsConfigEligible(this.test?.fullTitle()),
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver, { validateBalance: false });

        const perpsHomePage = new PerpsHomePage(driver);
        await perpsHomePage.navigateToPerpsHome();
        await perpsHomePage.waitForBalanceSection();
        await perpsHomePage.clickWithdraw();

        const withdrawPage = new PerpsWithdrawPage(driver);
        await withdrawPage.checkPageIsLoaded();
        // Default amount is 0 — submit should be disabled
        await withdrawPage.assertSubmitDisabled();
      },
    );
  });

  // eslint-disable-next-line mocha/no-skipped-tests -- Requires PERPS_ENABLED=true in test build; see web-socket-connection.spec.ts
  it.skip('shows validation error when withdrawal amount exceeds available balance', async function () {
    await withFixtures(
      {
        ...getPerpsConfigEligible(this.test?.fullTitle()),
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver, { validateBalance: false });

        const perpsHomePage = new PerpsHomePage(driver);
        await perpsHomePage.navigateToPerpsHome();
        await perpsHomePage.waitForBalanceSection();
        await perpsHomePage.clickWithdraw();

        const withdrawPage = new PerpsWithdrawPage(driver);
        await withdrawPage.checkPageIsLoaded();
        // Enter an amount exceeding the mock available balance (10125.00 USDC)
        await withdrawPage.fillAmount('99999');
        await withdrawPage.waitForValidationMessage('Insufficient');
        await withdrawPage.assertSubmitDisabled();
      },
    );
  });

  // eslint-disable-next-line mocha/no-skipped-tests -- Requires PERPS_ENABLED=true in test build; see web-socket-connection.spec.ts
  it.skip('shows validation error when withdrawal amount is below minimum', async function () {
    await withFixtures(
      {
        ...getPerpsConfigEligible(this.test?.fullTitle()),
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver, { validateBalance: false });

        const perpsHomePage = new PerpsHomePage(driver);
        await perpsHomePage.navigateToPerpsHome();
        await perpsHomePage.waitForBalanceSection();
        await perpsHomePage.clickWithdraw();

        const withdrawPage = new PerpsWithdrawPage(driver);
        await withdrawPage.checkPageIsLoaded();
        // Enter an amount below the minimum withdrawal (1.01 USDC)
        await withdrawPage.fillAmount('0.5');
        await withdrawPage.waitForValidationMessage('minimum');
        await withdrawPage.assertSubmitDisabled();
      },
    );
  });

  // eslint-disable-next-line mocha/no-skipped-tests -- Requires PERPS_ENABLED=true in test build; see web-socket-connection.spec.ts
  it.skip('cancel button navigates back to perps home from withdraw page', async function () {
    await withFixtures(
      {
        ...getPerpsConfigEligible(this.test?.fullTitle()),
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver, { validateBalance: false });

        const perpsHomePage = new PerpsHomePage(driver);
        await perpsHomePage.navigateToPerpsHome();
        await perpsHomePage.waitForBalanceSection();
        await perpsHomePage.clickWithdraw();

        const withdrawPage = new PerpsWithdrawPage(driver);
        await withdrawPage.checkPageIsLoaded();
        await withdrawPage.clickCancel();

        // After cancel, user should be back on Perps Home
        await perpsHomePage.waitForBalanceSection();
      },
    );
  });

  // eslint-disable-next-line mocha/no-skipped-tests -- Requires PERPS_ENABLED=true in test build; see web-socket-connection.spec.ts
  it.skip('back button navigates back from withdraw page', async function () {
    await withFixtures(
      {
        ...getPerpsConfigEligible(this.test?.fullTitle()),
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver, { validateBalance: false });

        const perpsHomePage = new PerpsHomePage(driver);
        await perpsHomePage.navigateToPerpsHome();
        await perpsHomePage.waitForBalanceSection();
        await perpsHomePage.clickWithdraw();

        const withdrawPage = new PerpsWithdrawPage(driver);
        await withdrawPage.checkPageIsLoaded();
        await withdrawPage.clickBack();

        // After clicking back, user should be back on Perps Home
        await perpsHomePage.waitForBalanceSection();
      },
    );
  });
});
