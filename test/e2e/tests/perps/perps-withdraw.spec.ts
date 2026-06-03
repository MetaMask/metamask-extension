/**
 * Perps Withdraw E2E tests
 *
 * These tests cover the legacy Withdraw page and the newer Withdraw
 * confirmation flow: navigation, form validation, summary row visibility,
 * and confirmation UI state.
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
import { PerpsWithdrawConfirmation } from '../../page-objects/pages/confirmations/perps-withdraw-confirmation';
import { PerpsHomePage } from '../../page-objects/pages/perps/perps-home-page';
import { PerpsWithdrawPage } from '../../page-objects/pages/perps/perps-withdraw-page';
import {
  getPerpsConfigEligible,
  getPerpsConfigEligibleWithArbitrumUsdc,
} from './perps-fixture-config';
import { WS_USER_WITH_FUNDED_ACCOUNT } from './mocks/websocketPositionMocks';

const withdrawFixtures = (title?: string) => ({
  ...getPerpsConfigEligible(title),
  perpsWebSocketSpecificMocks: WS_USER_WITH_FUNDED_ACCOUNT,
});

const withdrawConfirmationFixtures = (title?: string) => {
  const fixtures = {
    ...getPerpsConfigEligibleWithArbitrumUsdc(title),
    perpsWebSocketSpecificMocks: WS_USER_WITH_FUNDED_ACCOUNT,
  };

  return {
    ...fixtures,
  };
};

async function openPerpsWithdrawConfirmation(
  driver: Driver,
): Promise<PerpsWithdrawConfirmation> {
  await login(driver, { validateBalance: false });

  const perpsHomePage = new PerpsHomePage(driver);
  await perpsHomePage.navigateToPerpsHome();
  await perpsHomePage.checkPageIsLoaded();
  await perpsHomePage.waitForBalanceSection();
  await perpsHomePage.clickWithdraw();

  const withdrawConfirmation = new PerpsWithdrawConfirmation(driver);
  await withdrawConfirmation.checkPageIsLoaded();

  return withdrawConfirmation;
}

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

  it('submits a valid withdrawal from the confirmation flow', async function () {
    await withFixtures(
      {
        ...withdrawConfirmationFixtures(this.test?.fullTitle()),
      },
      async ({ driver }: { driver: Driver }) => {
        const withdrawConfirmation =
          await openPerpsWithdrawConfirmation(driver);

        await withdrawConfirmation.checkAvailableBalance('$10,000.00');
        await withdrawConfirmation.checkDestinationToken('USDC');
        await withdrawConfirmation.fillAmount('50');
        await withdrawConfirmation.checkWithdrawButtonEnabled();
        await withdrawConfirmation.clickWithdraw();
        await withdrawConfirmation.waitForSuccessToast();
      },
    );
  });

  it('blocks withdrawal amounts above the Perps available balance', async function () {
    await withFixtures(
      {
        ...withdrawConfirmationFixtures(this.test?.fullTitle()),
      },
      async ({ driver }: { driver: Driver }) => {
        const withdrawConfirmation =
          await openPerpsWithdrawConfirmation(driver);

        await withdrawConfirmation.fillAmount('10001');
        await withdrawConfirmation.waitForInsufficientFundsReason();
      },
    );
  });
});
