/**
 * Benchmark: Load New Account
 * Measures time to create and load a new account
 */

import FixtureBuilder from '../../../fixtures/fixture-builder';
import { unlockWallet, withFixtures } from '../../../helpers';
import HeaderNavbar from '../../../page-objects/pages/header-navbar';
import AccountListPage from '../../../page-objects/pages/account-list-page';
import { Driver } from '../../../webdriver/driver';

export async function run(): Promise<{
  duration: number;
  testTitle: string;
  persona: string;
}> {
  let loadingTimes: number = 0;
  const testTitle = 'benchmark-userActions-loadNewAccount';

  await withFixtures(
    {
      fixtures: new FixtureBuilder().build(),
      disableServerMochaToBackground: true,
      localNodeOptions: {
        accounts: 1,
      },
      title: testTitle,
    },
    async ({ driver }: { driver: Driver }) => {
      await unlockWallet(driver);

      const headerNavbar = new HeaderNavbar(driver);
      await headerNavbar.openAccountMenu();
      const accountListPage = new AccountListPage(driver);
      await accountListPage.checkPageIsLoaded();

      const timestampBeforeAction = new Date();
      await accountListPage.addMultichainAccount();
      const timestampAfterAction = new Date();
      loadingTimes =
        timestampAfterAction.getTime() - timestampBeforeAction.getTime();
    },
  );

  return { duration: loadingTimes, testTitle, persona: 'standard' };
}
