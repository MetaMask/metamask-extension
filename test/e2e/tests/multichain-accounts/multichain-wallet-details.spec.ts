import { Suite } from 'mocha';
import { Mockttp } from 'mockttp';
import AccountListPage from '../../page-objects/pages/account-list-page';
import WalletDetailsPage from '../../page-objects/pages/wallet-details-page';
import { Driver } from '../../webdriver/driver';
import { withFixtures } from '../../helpers';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import HomePage from '../../page-objects/pages/home/homepage';
import FixtureBuilder from '../../fixture-builder';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';
import { ACCOUNT_TYPE } from '../../constants';
import {
  mockMultichainAccountsFeatureFlag,
} from './common';

describe('Multichain Accounts - Wallet Details', function (this: Suite) {
  it('should view wallet details with one Ethereum and one Solana account and show SRP backup reminder', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder()
          .withKeyringControllerMultiSRP()
          .withEnabledNetworks({
            eip155: {
              '0x539': true,
            },
            solana: {
              'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp': true,
            },
          })
          .withPreferencesController({
            dismissSeedBackUpReminder: false,
          })
          .build(),
        title: this.test?.fullTitle(),
        testSpecificMock: async (mockServer: Mockttp) => {
          return mockMultichainAccountsFeatureFlag(mockServer);
        },
        manifestFlags: {
          remoteFeatureFlags: {
            addSolanaAccount: true,
          },
        },
        dapp: true,
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithBalanceValidation(driver);
        const homePage = new HomePage(driver);
        await homePage.check_pageIsLoaded();
        const headerNavbar = new HeaderNavbar(driver);
        await headerNavbar.openAccountMenu();

        const accountListPage = new AccountListPage(driver);
        await accountListPage.check_pageIsLoaded();

        // Create a Solana account to match test scenario requirements
        await accountListPage.addAccount({
          accountType: ACCOUNT_TYPE.Solana,
          accountName: 'Solana Account 1',
        });
        await homePage.check_pageIsLoaded();
        await headerNavbar.openAccountMenu();
        await accountListPage.check_pageIsLoaded();

        await accountListPage.check_walletDetailsButtonIsDisplayed();
        await accountListPage.clickWalletDetailsButton();

        const walletDetailsPage = new WalletDetailsPage(driver);
        await walletDetailsPage.check_pageIsLoaded();

        await walletDetailsPage.check_walletNameIsDisplayed('Wallet 1');
        await walletDetailsPage.check_balanceIsDisplayed('$42,500.00');
        await walletDetailsPage.check_accountIsDisplayed('Account 1');
        await walletDetailsPage.check_accountIsDisplayed('Solana Account 1');
      },
    );
  });

  it('should add new Ethereum account from wallet details', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder()
          .withKeyringControllerMultiSRP()
          .withEnabledNetworks({
            eip155: {
              '0x539': true,
            },
            solana: {
              'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp': true,
            },
          })
          .build(),
        title: this.test?.fullTitle(),
        testSpecificMock: async (mockServer: Mockttp) => {
          return mockMultichainAccountsFeatureFlag(mockServer);
        },
        manifestFlags: {
          remoteFeatureFlags: {
            addSolanaAccount: true,
          },
        },
        dapp: true,
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithBalanceValidation(driver);
        const homePage = new HomePage(driver);
        await homePage.check_pageIsLoaded();
        const headerNavbar = new HeaderNavbar(driver);
        await headerNavbar.openAccountMenu();

        const accountListPage = new AccountListPage(driver);
        await accountListPage.check_pageIsLoaded();

        // Create a Solana account to match test scenario requirements
        await accountListPage.addAccount({
          accountType: ACCOUNT_TYPE.Solana,
          accountName: 'Solana Account 1',
        });
        await homePage.check_pageIsLoaded();
        await headerNavbar.openAccountMenu();
        await accountListPage.check_pageIsLoaded();

        await accountListPage.check_walletDetailsButtonIsDisplayed();
        await accountListPage.clickWalletDetailsButton();

        const walletDetailsPage = new WalletDetailsPage(driver);
        await walletDetailsPage.check_pageIsLoaded();

        await walletDetailsPage.check_addAccountButtonIsDisplayed();
        await walletDetailsPage.clickAddAccountButton();

        await walletDetailsPage.check_accountTypeModalIsDisplayed();
        await walletDetailsPage.check_ethereumAccountOptionIsDisplayed();
        await walletDetailsPage.check_solanaAccountOptionIsDisplayed();

        await walletDetailsPage.clickEthereumAccountOption();

        await walletDetailsPage.check_numberOfAccountsDisplayed(3);
      },
    );
  });
});