import { Mockttp } from 'mockttp';
import { Suite } from 'mocha';
import { withFixtures } from '../../helpers';
import AccountListPage from '../../page-objects/pages/account-list-page';
import { Driver } from '../../webdriver/driver';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import { mockEtherumSpotPrices } from '../tokens/utils/mocks';
import FixtureBuilder from '../../fixture-builder';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';

describe('Multichain Accounts - Wallet Details', function (this: Suite) {
  it('should view wallet details with one Ethereum', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder()
          .withPreferencesControllerShowNativeTokenAsMainBalanceDisabled()
          .withKeyringControllerMultiSRP()
          .withEnabledNetworks({ eip155: { '0x1': true } })
          .build(),
        title: this.test?.fullTitle(),
        testSpecificMock: async (mockServer: Mockttp) => {
          return mockEtherumSpotPrices(mockServer);
        },
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithBalanceValidation(
          driver,
          undefined,
          undefined,
          '$42,500.00',
        );
        const headerNavbar = new HeaderNavbar(driver);
        await headerNavbar.openAccountMenu();

        const accountListPage = new AccountListPage(driver);
        await accountListPage.checkPageIsLoaded();

        await accountListPage.checkWalletDisplayedInAccountListMenu('Wallet 1');
        await accountListPage.checkAccountNameIsDisplayed('Account 1');
        await accountListPage.checkWalletDisplayedInAccountListMenu('Wallet 2');
        await accountListPage.checkAccountNameIsDisplayed('Account 2');

        await accountListPage.checkMultichainAccountBalanceDisplayed(
          '$42,500.00',
        );
      },
    );
  });
});
