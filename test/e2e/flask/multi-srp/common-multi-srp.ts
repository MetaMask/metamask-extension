import { Mockttp } from 'mockttp';
import { Driver } from '../../webdriver/driver';
import FixtureBuilder from '../../fixture-builder';
import { withFixtures, unlockWallet } from '../../helpers';
import AccountListPage from '../../page-objects/pages/account-list-page';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import HomePage from '../../page-objects/pages/home/homepage';

export const SECOND_TEST_E2E_SRP =
  'bench top weekend buyer spoon side resist become detect gauge eye feed';

export async function withMultiSrp(
  { title }: { title?: string },
  test: (driver: Driver) => Promise<void>,
  srpToUse: string = SECOND_TEST_E2E_SRP,
) {
  await withFixtures(
    {
      fixtures: new FixtureBuilder().build(),
      title,
      dapp: true,
    },
    async ({ driver }: { driver: Driver; mockServer: Mockttp }) => {
      await unlockWallet(driver);
      const homePage = new HomePage(driver);
      await homePage.check_pageIsLoaded();
      const headerNavbar = new HeaderNavbar(driver);
      await headerNavbar.openAccountMenu();
      const accountListPage = new AccountListPage(driver);
      await accountListPage.check_pageIsLoaded();
      await accountListPage.startImportSecretPhrase(srpToUse);
      await test(driver);
    },
  );
}
