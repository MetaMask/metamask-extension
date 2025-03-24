import { Suite } from 'mocha';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import AccountListPage from '../../page-objects/pages/account-list-page';
import { ACCOUNT_TYPE } from '../../constants';
import FixtureBuilder from '../../fixture-builder';
import { withFixtures } from '../../helpers';
import { completeImportSRPOnboardingFlow } from '../../page-objects/flows/onboarding.flow';
import HomePage from '../../page-objects/pages/home/homepage';
import { withSolanaAccountSnap } from './common-solana';

describe.only('Opt-in Solana modal is displayed', function (this: Suite) {
  it('when the user has no Solana account', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder({ onboarding: true }).build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }) => {
        await completeImportSRPOnboardingFlow({
          driver,
          fillSrpWordByWord: true,
          isFlask: true,
        });
        const homePage = new HomePage(driver);
        await homePage.check_pageIsLoaded();
        await driver.delay(1000000);
      },
    );
  });
  it('Creates 2 Solana accounts', async function () {
    await withSolanaAccountSnap(
      { title: this.test?.fullTitle() },
      async (driver) => {
        // check that we have one Solana account
        const headerNavbar = new HeaderNavbar(driver);
        await headerNavbar.check_pageIsLoaded();
        await headerNavbar.check_accountLabel('Solana 1');
        await headerNavbar.openAccountMenu();
        const accountListPage = new AccountListPage(driver);
        await accountListPage.check_accountDisplayedInAccountList('Account 1');
        await accountListPage.addAccount({
          accountType: ACCOUNT_TYPE.Solana,
          accountName: 'Solana 2',
        });
        await headerNavbar.check_accountLabel('Solana 2');
        await headerNavbar.openAccountMenu();
        await accountListPage.check_numberOfAvailableAccounts(3);
      },
    );
  });
  it('Creates a Solana account from the menu', async function () {
    await withSolanaAccountSnap(
      { title: this.test?.fullTitle() },
      async (driver) => {
        const headerNavbar = new HeaderNavbar(driver);
        await headerNavbar.check_pageIsLoaded();
        await headerNavbar.check_accountLabel('Solana 1');
        await headerNavbar.openAccountMenu();
        const accountListPage = new AccountListPage(driver);
        await accountListPage.check_accountDisplayedInAccountList('Account 1');
        await accountListPage.check_accountDisplayedInAccountList('Solana 1');
      },
    );
  });
});
it('Removes Solana account after creating it', async function () {
  await withSolanaAccountSnap(
    { title: this.test?.fullTitle() },
    async (driver) => {
      // check that we have one Solana account
      const headerNavbar = new HeaderNavbar(driver);
      await headerNavbar.check_accountLabel('Solana 1');
      // check user can cancel the removal of the Solana account
      await headerNavbar.openAccountMenu();
      const accountListPage = new AccountListPage(driver);
      await accountListPage.check_accountDisplayedInAccountList('Account 1');
      await accountListPage.removeAccount('Solana 1', true);
      await headerNavbar.check_accountLabel('Account 1');
      await headerNavbar.openAccountMenu();
      await accountListPage.check_accountDisplayedInAccountList('Account 1');
      await accountListPage.check_accountIsNotDisplayedInAccountList(
        'Solana 1',
      );
    },
  );
});
