import HomePage from '../pages/home/homepage';
import { PerpsWithdrawConfirmation } from '../pages/confirmations/perps-withdraw-confirmation';
import { PerpsHomePage } from '../pages/perps/perps-home-page';
import { PerpsWithdrawPage } from '../pages/perps/perps-withdraw-page';
import type { Driver } from '../../webdriver/driver';

async function openPerpsWithdrawEntry(driver: Driver): Promise<void> {
  const homePage = new HomePage(driver);
  const perpsHomePage = new PerpsHomePage(driver);
  await homePage.goToPerpsTab();
  await perpsHomePage.checkPageIsLoaded();
  await perpsHomePage.waitForBalanceSection();
  await perpsHomePage.waitForRecentActivitySection();
  await perpsHomePage.clickWithdraw();
}

/**
 * Opens the legacy Perps withdraw page from the Perps home page.
 *
 * @param driver - The webdriver instance.
 */
export async function openPerpsWithdrawLegacy({
  driver,
}: {
  driver: Driver;
}): Promise<PerpsWithdrawPage> {
  await openPerpsWithdrawEntry(driver);

  const withdrawPage = new PerpsWithdrawPage(driver);
  await withdrawPage.checkPageIsLoaded();
  await withdrawPage.waitForSummaryRows();

  return withdrawPage;
}

/**
 * Opens the Perps withdraw confirmation entrypoint from the Perps home page.
 *
 * @param driver - The webdriver instance.
 */
export async function openPerpsWithdrawConfirmation({
  driver,
}: {
  driver: Driver;
}): Promise<PerpsWithdrawConfirmation> {
  await openPerpsWithdrawEntry(driver);

  const withdrawConfirmation = new PerpsWithdrawConfirmation(driver);
  await withdrawConfirmation.checkPageIsLoaded();

  return withdrawConfirmation;
}
