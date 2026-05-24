import { Suite } from 'mocha';
import FixtureBuilderV2 from '../../../fixtures/fixture-builder-v2';
import {
  withSpeculosFixtures,
  startSharedSpeculos,
  stopSharedSpeculos,
} from '../../../speculos/with-speculos-fixtures';
import type { SharedSpeculosContext } from '../../../speculos/with-speculos-fixtures';
import type { DeviceInteraction } from '../../../speculos/device-interaction';
import { SPECULOS_LEDGER_ADDRESS } from '../../../speculos/constants';
import AccountListPage from '../../../page-objects/pages/account-list-page';
import ActivityListPage from '../../../page-objects/pages/home/activity-list';
import HeaderNavbar from '../../../page-objects/pages/header-navbar';
import HomePage from '../../../page-objects/pages/home/homepage';
import { login } from '../../../page-objects/flows/login.flow';
import { switchToHardwareAccount } from '../../../page-objects/flows/account-list.flow';
import { sendRedesignedTransactionToAddress } from '../../../page-objects/flows/send-transaction.flow';

const RECIPIENT = '0x0Cc5261AB8cE458dc977078A3623E2BaDD27afD3';

const LEDGER_SEED_BALANCE = [
  { address: SPECULOS_LEDGER_ADDRESS, balance: '0x100000000000000000000' },
];

async function rejectOnDevice(interaction: DeviceInteraction): Promise<void> {
  await interaction.rejectTransaction();
}

describe('Ledger Hardware Wallet Error Modals @speculos', function (this: Suite) {
  this.timeout(180000);

  let shared: SharedSpeculosContext;

  before(async function () {
    this.timeout(120000);
    shared = await startSharedSpeculos();
  });

  after(async function () {
    this.timeout(30000);
    await stopSharedSpeculos(shared);
  });

  describe('User Rejection', function () {
    it('rejects a transaction on the Ledger device and shows no confirmed tx', async function () {
      await withSpeculosFixtures(
        {
          fixtures: new FixtureBuilderV2().withLedgerAccount().build(),
          localNodeOptions: { hardfork: 'london' },
          title: this.test?.fullTitle(),
          sharedContext: shared,
          seedBalances: LEDGER_SEED_BALANCE,
        },
        async ({ driver, interaction, apduBridge }) => {
          await login(driver, { validateBalance: false });
          await switchToHardwareAccount(driver, 'Ledger 1');

          const rejectPromise = (async () => {
            await apduBridge.waitForSigningApdu(90000);
            await new Promise((r) => setTimeout(r, 1000));
            await rejectOnDevice(interaction);
          })();

          await sendRedesignedTransactionToAddress({
            driver,
            recipientAddress: RECIPIENT,
            amount: '1',
          });

          await rejectPromise;

          const homePage = new HomePage(driver);
          await homePage.checkPageIsLoaded();
          const activityList = new ActivityListPage(driver);
          const hasConfirmed = await driver.isElementPresent({
            css: '.transaction-status-label--confirmed',
          });
          if (hasConfirmed) {
            throw new Error(
              'Expected no confirmed transaction after Ledger rejection',
            );
          }
        },
      );
    });
  });

  describe('Account Management', function () {
    it('removes a Ledger account from the account list', async function () {
      await withSpeculosFixtures(
        {
          fixtures: new FixtureBuilderV2().withLedgerAccount().build(),
          title: this.test?.fullTitle(),
          sharedContext: shared,
        },
        async ({ driver }) => {
          await login(driver, { validateBalance: false });

          const headerNavbar = new HeaderNavbar(driver);
          await headerNavbar.openAccountMenu();

          const accountListPage = new AccountListPage(driver);
          await accountListPage.checkPageIsLoaded();

          await accountListPage.removeAccount('Ledger 1');

          await accountListPage.checkAccountIsNotDisplayedInAccountList(
            'Ledger 1',
          );
        },
      );
    });
  });
});
