import { Suite } from 'mocha';
import FixtureBuilder from '../../fixture-builder';
import { withFixtures } from '../../helpers';
import { KNOWN_PUBLIC_KEY_ADDRESSES } from '../../../stub/keyring-bridge';
import ActivityListPage from '../../page-objects/pages/home/activity-list';
import HomePage from '../../page-objects/pages/home/homepage';
import { sendRedesignedTransactionToAddress } from '../../page-objects/flows/send-transaction.flow';
import { loginWithoutBalanceValidation } from '../../page-objects/flows/login.flow';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import ConnectHardwareWalletPage from '../../page-objects/pages/hardware-wallet/connect-hardware-wallet-page';
import SelectHardwareWalletAccountPage from '../../page-objects/pages/hardware-wallet/select-hardware-wallet-account-page';
import AccountListPage from '../../page-objects/pages/account-list-page';

const RECIPIENT = '0x0Cc5261AB8cE458dc977078A3623E2BaDD27afD3';

describe('Ledger Hardware', function (this: Suite) {
  it('send ETH using an EIP1559 transaction', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        localNodeOptions: {
          hardfork: 'london',
        },
        title: this.test?.fullTitle(),
      },
      async ({ driver, localNodes }) => {
        // Seed the Ledger account with balance
        (await localNodes?.[0]?.setAccountBalance(
          KNOWN_PUBLIC_KEY_ADDRESSES[0].address,
          '0x100000000000000000000',
        )) ?? console.error('localNodes is undefined or empty');
        await loginWithoutBalanceValidation(driver);
        const homePage = new HomePage(driver);
        const headerNavbar = new HeaderNavbar(driver);
        await headerNavbar.openAccountMenu();

        // Choose connect hardware wallet from the account menu
        const accountListPage = new AccountListPage(driver);
        await accountListPage.check_pageIsLoaded();
        await accountListPage.openConnectHardwareWalletModal();

        const connectHardwareWalletPage = new ConnectHardwareWalletPage(driver);
        await connectHardwareWalletPage.check_pageIsLoaded();
        await connectHardwareWalletPage.openConnectLedgerPage();

        const selectLedgerAccountPage = new SelectHardwareWalletAccountPage(
          driver,
        );
        await selectLedgerAccountPage.check_pageIsLoaded();

        // Check that the first page of accounts is correct
        await selectLedgerAccountPage.check_accountNumber();
        for (const { address } of KNOWN_PUBLIC_KEY_ADDRESSES.slice(0, 4)) {
          const shortenedAddress = `${address.slice(0, 4)}...${address.slice(
            -4,
          )}`;
          await selectLedgerAccountPage.check_addressIsDisplayed(
            shortenedAddress,
          );
        }

        // Unlock first account of first page and check that the correct account has been added
        await selectLedgerAccountPage.unlockAccount(1);
        await headerNavbar.check_pageIsLoaded();
        await homePage.check_expectedBalanceIsDisplayed('1208925.8196');
        await sendRedesignedTransactionToAddress({
          driver,
          recipientAddress: RECIPIENT,
          amount: '1',
        });
        await homePage.check_pageIsLoaded();
        const activityList = new ActivityListPage(driver);
        await activityList.check_confirmedTxNumberDisplayedInActivity();
        await activityList.check_txAmountInActivity();
      },
    );
  });
  it('send ETH using a legacy transaction', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        localNodeOptions: {
          hardfork: 'muirGlacier',
        },
        title: this.test?.fullTitle(),
      },
      async ({ driver, localNodes }) => {
        // Seed the Ledger account with balance
        (await localNodes?.[0]?.setAccountBalance(
          KNOWN_PUBLIC_KEY_ADDRESSES[0].address,
          '0x100000000000000000000',
        )) ?? console.error('localNodes is undefined or empty');
        await loginWithoutBalanceValidation(driver);
        const homePage = new HomePage(driver);
        const headerNavbar = new HeaderNavbar(driver);
        await headerNavbar.openAccountMenu();

        // Choose connect hardware wallet from the account menu
        const accountListPage = new AccountListPage(driver);
        await accountListPage.check_pageIsLoaded();
        await accountListPage.openConnectHardwareWalletModal();

        const connectHardwareWalletPage = new ConnectHardwareWalletPage(driver);
        await connectHardwareWalletPage.check_pageIsLoaded();
        await connectHardwareWalletPage.openConnectLedgerPage();

        const selectLedgerAccountPage = new SelectHardwareWalletAccountPage(
          driver,
        );
        await selectLedgerAccountPage.check_pageIsLoaded();

        // Check that the first page of accounts is correct
        await selectLedgerAccountPage.check_accountNumber();
        for (const { address } of KNOWN_PUBLIC_KEY_ADDRESSES.slice(0, 4)) {
          const shortenedAddress = `${address.slice(0, 4)}...${address.slice(
            -4,
          )}`;
          await selectLedgerAccountPage.check_addressIsDisplayed(
            shortenedAddress,
          );
        }

        // Unlock first account of first page and check that the correct account has been added
        await selectLedgerAccountPage.unlockAccount(1);
        await headerNavbar.check_pageIsLoaded();
        await homePage.check_expectedBalanceIsDisplayed('1208925.8196');
        await sendRedesignedTransactionToAddress({
          driver,
          recipientAddress: RECIPIENT,
          amount: '1',
        });
        await homePage.check_pageIsLoaded();
        const activityList = new ActivityListPage(driver);
        await activityList.check_confirmedTxNumberDisplayedInActivity();
        await activityList.check_txAmountInActivity();
      },
    );
  });
});
