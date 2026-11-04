import { Suite } from 'mocha';
import { withFixtures } from '../../helpers';
import type { Anvil } from '../../seeder/anvil';
import { Driver } from '../../webdriver/driver';
import BottomNavBar from '../../page-objects/pages/home/bottom-nav-bar-page';
import MoneyFtueSplashPage from '../../page-objects/pages/money/money-ftue-splash-page';
import MoneyHomePage from '../../page-objects/pages/money/money-home-page';
import { loginAndOpenMoneyHome } from '../../page-objects/flows/money-account-deposit.flow';
import { getMoneyAccountDepositConfig } from '../confirmations/metamask-pay/helpers';

/**
 * MUSD-1504: the Money account FTUE splash is shown once, on the first Money
 * interaction, and the seen flag survives a UI reload.
 */
describe('Money Account FTUE', function (this: Suite) {
  this.timeout(180_000);

  it('shows the splash on the first Money tab visit and not after acknowledgement', async function () {
    await withFixtures(
      getMoneyAccountDepositConfig({
        title: this.test?.fullTitle(),
        moneyFtueSeen: false,
      }),
      async ({
        driver,
        localNodes,
      }: {
        driver: Driver;
        localNodes: Anvil[];
      }) => {
        await loginAndOpenMoneyHome(driver, localNodes[0]);

        const splash = new MoneyFtueSplashPage(driver);
        await splash.checkPageIsLoaded();
        await splash.clickStartEarning();

        const moneyHomePage = new MoneyHomePage(driver);
        await moneyHomePage.checkPageIsLoaded();
        await splash.checkIsNotShown();

        // Reload so the persisted seen flag is read back from background
        // state, then revisit Money through the tab.
        await driver.navigate();
        const bottomNavBar = new BottomNavBar(driver);
        await bottomNavBar.checkPageIsLoaded();
        await bottomNavBar.clickMoney();
        await moneyHomePage.checkPageIsLoaded();
        await splash.checkIsNotShown();
      },
    );
  });

  it('does not show the splash for returning users', async function () {
    await withFixtures(
      getMoneyAccountDepositConfig({ title: this.test?.fullTitle() }),
      async ({
        driver,
        localNodes,
      }: {
        driver: Driver;
        localNodes: Anvil[];
      }) => {
        await loginAndOpenMoneyHome(driver, localNodes[0]);

        const splash = new MoneyFtueSplashPage(driver);
        await splash.checkIsNotShown();
      },
    );
  });
});
