import { generateWalletState } from '../../app/scripts/fixtures/generate-wallet-state';
import { WITH_STATE_POWER_USER } from '../e2e/benchmarks/constants';
import { withFixtures } from '../e2e/helpers';
import AccountListPage from '../e2e/page-objects/pages/account-list-page';
import HeaderNavbar from '../e2e/page-objects/pages/header-navbar';
import HomePage from '../e2e/page-objects/pages/home/homepage';
import LoginPage from '../e2e/page-objects/pages/login-page';
import { Driver } from '../e2e/webdriver/driver';
import {
  setupPerformanceReporting,
  performanceTracker,
  TimerHelper,
} from './utils/testSetup';

describe('Power user persona', function () {
  setupPerformanceReporting();

  it('loads the requested number of accounts', async function () {
    if (!process.env.INFURA_PROJECT_ID) {
      throw new Error(
        'Running this E2E test requires a valid process.env.INFURA_PROJECT_ID',
      );
    }

    await withFixtures(
      {
        title: this.test?.fullTitle(),
        fixtures: (
          await generateWalletState(WITH_STATE_POWER_USER, true)
        ).build(),
        manifestFlags: {
          testing: {
            disableSync: true,
            infuraProjectId: process.env.INFURA_PROJECT_ID,
          },
        },
        useMockingPassThrough: true,
        disableServerMochaToBackground: true,
        extendedTimeoutMultiplier: 3,
      },
      async ({ driver }: { driver: Driver }) => {
        const timerLogin = new TimerHelper(
          'Time to login and reach home page',
          15000,
        );
        const timerAccountListLoad = new TimerHelper(
          'Time to load account list with all accounts',
          10000,
        );

        // Measure: Login flow
        await driver.navigate();
        const loginPage = new LoginPage(driver);
        await timerLogin.measure(async () => {
          await loginPage.loginToHomepage();
          const homePage = new HomePage(driver);
          await homePage.checkPageIsLoaded();
        });
        performanceTracker.addTimer(timerLogin);

        // Measure: Account list load
        const headerNavbar = new HeaderNavbar(driver);
        await headerNavbar.openAccountMenu();
        await timerAccountListLoad.measure(async () => {
          const accountListPage = new AccountListPage(driver);
          await accountListPage.checkNumberOfAvailableAccounts(
            WITH_STATE_POWER_USER.withAccounts,
          );
          await accountListPage.checkAccountDisplayedInAccountList(
            `Account ${WITH_STATE_POWER_USER.withAccounts}`,
          );
        });
        performanceTracker.addTimer(timerAccountListLoad);
      },
    );
  });
});
