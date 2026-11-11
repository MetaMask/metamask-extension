import { Suite } from 'mocha';
import { withFixtures } from '../../helpers';
import { Driver } from '../../webdriver/driver';
import {
  openMoneyFtueSplash,
  openMoneyHome,
} from '../../page-objects/flows/money-account-deposit.flow';
import { login } from '../../page-objects/flows/login.flow';
import MoneyHomePage from '../../page-objects/pages/money/money-home-page';
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
      async ({ driver }: { driver: Driver }) => {
        await login(driver);

        const splash = await openMoneyFtueSplash(driver);

        // Money home mounts and loads behind the splash.
        const moneyHomePage = new MoneyHomePage(driver);
        await moneyHomePage.checkPageIsLoaded();

        await splash.clickStartEarning();
        await moneyHomePage.checkPageIsLoaded();
        await splash.checkIsNotShown();

        // Reload so the persisted seen flag is read back from background
        // state, then revisit Money through the tab.
        await driver.navigate();
        await openMoneyHome(driver);
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
      async ({ driver }: { driver: Driver }) => {
        await login(driver);

        const splash = await openMoneyFtueSplash(driver);

        const moneyHomePage = new MoneyHomePage(driver);
        await moneyHomePage.checkPageIsLoaded();

        await splash.clickClose();
        await moneyHomePage.checkPageIsLoaded();
        await splash.checkIsNotShown();
      },
    );
  });
});
