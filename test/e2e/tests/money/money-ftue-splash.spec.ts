import { Suite } from 'mocha';
import { withFixtures } from '../../helpers';
import type { Anvil } from '../../seeder/anvil';
import { Driver } from '../../webdriver/driver';
import BottomNavBar from '../../page-objects/pages/home/bottom-nav-bar-page';
import MoneyHomePage from '../../page-objects/pages/money/money-home-page';
import { loginAndOpenMoneyFtueSplash } from '../../page-objects/flows/money-account-deposit.flow';
import { getMoneyAccountDepositConfig } from '../confirmations/metamask-pay/helpers';

/**
 * MUSD-1504: the Money account FTUE splash is shown once, on the first Money
 * interaction, and the seen flag survives a UI reload.
 */
describe('Money Account FTUE', function (this: Suite) {
  it('shows the splash only on the first Money tab visit', async function () {
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
        const splash = await loginAndOpenMoneyFtueSplash(driver, localNodes[0]);
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

  it('opens Money home when the splash is closed with X', async function () {
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
        const splash = await loginAndOpenMoneyFtueSplash(driver, localNodes[0]);
        await splash.clickClose();

        const moneyHomePage = new MoneyHomePage(driver);
        await moneyHomePage.checkPageIsLoaded();
        await splash.checkIsNotShown();
      },
    );
  });
});
