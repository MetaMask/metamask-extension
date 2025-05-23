import { withFixtures } from '../../helpers';
import FixtureBuilder from '../../fixture-builder';
import { ACCOUNT_TYPE } from '../../constants';
import AccountDetailsModal from '../../page-objects/pages/dialog/account-details-modal';
import AccountListPage from '../../page-objects/pages/account-list-page';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';

describe('Show account details', function () {
  const wrongPassword = 'test test test test';

  it('should show the correct private key from account menu', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }) => {
        await loginWithBalanceValidation(driver);
        await new HeaderNavbar(driver).openAccountMenu();
        const accountListPage = new AccountListPage(driver);
        await accountListPage.check_pageIsLoaded();
        await accountListPage.openAccountDetailsModal('Account 1');
        const accountDetailsModal = new AccountDetailsModal(driver);
        await accountDetailsModal.check_pageIsLoaded();
        await accountDetailsModal.goToDetailsTab();
        await accountDetailsModal.revealPrivateKeyAndVerify({
          expectedPrivateKey:
            '7c9529a67102755b7e6102d6d950ac5d5863c98713805cec576b945b15b71eac',
        });
      },
    );
  });

  it('should show the correct private key for an unselected account from account menu', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }) => {
        await loginWithBalanceValidation(driver);
        await new HeaderNavbar(driver).openAccountMenu();
        const accountListPage = new AccountListPage(driver);
        await accountListPage.check_pageIsLoaded();

        // Create and focus on different account
        await accountListPage.addAccount({
          accountType: ACCOUNT_TYPE.Ethereum,
          accountName: '2nd account',
        });
        const headerNavbar = new HeaderNavbar(driver);
        await headerNavbar.check_accountLabel('2nd account');

        // Reveal private key for Account 1
        await headerNavbar.openAccountMenu();
        await accountListPage.check_pageIsLoaded();
        await accountListPage.openAccountDetailsModal('Account 1');
        const accountDetailsModal = new AccountDetailsModal(driver);
        await accountDetailsModal.check_pageIsLoaded();
        await accountDetailsModal.goToDetailsTab();
        await accountDetailsModal.revealPrivateKeyAndVerify({
          expectedPrivateKey:
            '7c9529a67102755b7e6102d6d950ac5d5863c98713805cec576b945b15b71eac',
        });
      },
    );
  });

  it('should show the correct private key from global menu', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }) => {
        await loginWithBalanceValidation(driver);
        await new HeaderNavbar(driver).openAccountDetailsModal();
        const accountDetailsModal = new AccountDetailsModal(driver);
        await accountDetailsModal.check_pageIsLoaded();
        await accountDetailsModal.goToDetailsTab();
        await accountDetailsModal.revealPrivateKeyAndVerify({
          expectedPrivateKey:
            '7c9529a67102755b7e6102d6d950ac5d5863c98713805cec576b945b15b71eac',
        });
      },
    );
  });

  it('should show the correct private key for a second account from global menu', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }) => {
        await loginWithBalanceValidation(driver);
        await new HeaderNavbar(driver).openAccountMenu();
        const accountListPage = new AccountListPage(driver);
        await accountListPage.check_pageIsLoaded();

        // Create and focus on second account
        await accountListPage.addAccount({
          accountType: ACCOUNT_TYPE.Ethereum,
          accountName: '2nd account',
        });
        const headerNavbar = new HeaderNavbar(driver);
        await headerNavbar.check_accountLabel('2nd account');

        // Reveal private key for Account 2
        await headerNavbar.openAccountDetailsModal();
        const accountDetailsModal = new AccountDetailsModal(driver);
        await accountDetailsModal.check_pageIsLoaded();
        await accountDetailsModal.goToDetailsTab();
        await accountDetailsModal.revealPrivateKeyAndVerify({
          expectedPrivateKey:
            'f444f52ea41e3a39586d7069cb8e8233e9f6b9dea9cbb700cce69ae860661cc8',
        });
      },
    );
  });

  it('should not reveal private key when password is incorrect', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        title: this.test?.fullTitle(),
        ignoredConsoleErrors: ['Error in verifying password'],
      },
      async ({ driver }) => {
        await loginWithBalanceValidation(driver);
        await new HeaderNavbar(driver).openAccountMenu();
        const accountListPage = new AccountListPage(driver);
        await accountListPage.check_pageIsLoaded();
        await accountListPage.openAccountDetailsModal('Account 1');
        const accountDetailsModal = new AccountDetailsModal(driver);
        await accountDetailsModal.check_pageIsLoaded();
        await accountDetailsModal.goToDetailsTab();

        // Attempt to reveal private key from account menu with a wrong password and verify the error message
        await accountDetailsModal.revealPrivateKeyAndVerify({
          expectedPrivateKey:
            'f444f52ea41e3a39586d7069cb8e8233e9f6b9dea9cbb700cce69ae860661cc8',
          password: wrongPassword,
          expectedPasswordError: true,
        });
      },
    );
  });
});
