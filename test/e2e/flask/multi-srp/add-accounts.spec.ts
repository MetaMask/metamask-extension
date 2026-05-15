import { Suite } from 'mocha';
import { Driver } from '../../webdriver/driver';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { withFixtures } from '../../helpers';
import { login } from '../../page-objects/flows/login.flow';
import { importAdditionalSecretRecoveryPhrase } from '../../page-objects/flows/multi-srp.flow';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import AccountListPage from '../../page-objects/pages/account-list-page';
import { mockActiveNetworks } from './common-multi-srp';

const addAccountToSrp = async (driver: Driver, srpIndex: number) => {
  const headerNavbar = new HeaderNavbar(driver);
  await headerNavbar.openAccountMenu();

  const accountListPage = new AccountListPage(driver);
  await accountListPage.checkPageIsLoaded();

  // This will create 'Account 2'.
  await accountListPage.addMultichainAccount({
    srpIndex,
  });

  await accountListPage.closeMultichainAccountsPage();
  await accountListPage.checkAccountBelongsToSrp('Account 2', srpIndex + 1);
};

describe('Multi SRP - Add accounts', function (this: Suite) {
  it('adds a new account for the default srp', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockActiveNetworks,
      },
      async ({ driver }) => {
        await login(driver);
        await importAdditionalSecretRecoveryPhrase(driver);
        await addAccountToSrp(driver, 0);
      },
    );
  });

  it('adds a new account for the new srp', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockActiveNetworks,
      },
      async ({ driver }) => {
        await login(driver);
        await importAdditionalSecretRecoveryPhrase(driver);
        await addAccountToSrp(driver, 1);
      },
    );
  });
});
