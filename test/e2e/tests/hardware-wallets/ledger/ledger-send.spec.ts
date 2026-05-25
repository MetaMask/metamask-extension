import { Suite } from 'mocha';
import FixtureBuilderV2 from '../../../fixtures/fixture-builder-v2';
import {
  withSpeculosFixtures,
  startSharedSpeculos,
  stopSharedSpeculos,
} from '../../../speculos/with-speculos-fixtures';
import type { SharedSpeculosContext } from '../../../speculos/with-speculos-fixtures';
import ActivityListPage from '../../../page-objects/pages/home/activity-list';
import HomePage from '../../../page-objects/pages/home/homepage';
import { sendRedesignedTransactionToAddress } from '../../../page-objects/flows/send-transaction.flow';
import { login } from '../../../page-objects/flows/login.flow';
import { switchToHardwareAccount } from '../../../page-objects/flows/account-list.flow';
import {
  LEDGER_SEED_BALANCE,
  RECIPIENT,
  approveTransaction,
} from './ledger-helpers';

describe('Ledger Hardware Send @speculos', function (this: Suite) {
  this.timeout(120000);

  let shared: SharedSpeculosContext;

  before(async function () {
    this.timeout(120000);
    shared = await startSharedSpeculos();
  });

  after(async function () {
    this.timeout(30000);
    await stopSharedSpeculos(shared);
  });

  it('send ETH using an EIP1559 transaction', async function () {
    await withSpeculosFixtures(
      {
        fixtures: new FixtureBuilderV2().withSpeculosLedgerAccount().build(),
        localNodeOptions: {
          hardfork: 'london',
        },
        title: this.test?.fullTitle(),
        sharedContext: shared,
        seedBalances: LEDGER_SEED_BALANCE,
      },
      async ({ driver, interaction, apduBridge }) => {
        await login(driver, { validateBalance: false });
        await switchToHardwareAccount(driver, 'Ledger 1');

        const homePage = new HomePage(driver);
        await homePage.checkExpectedBalanceIsDisplayed('1.21M');

        const ledgerDone = approveTransaction(interaction, apduBridge);
        await sendRedesignedTransactionToAddress({
          driver,
          recipientAddress: RECIPIENT,
          amount: '1',
        });
        await ledgerDone;

        await homePage.checkPageIsLoaded();
        await homePage.goToActivityList();
        const activityList = new ActivityListPage(driver);
        await activityList.checkConfirmedTxNumberDisplayedInActivity();
        await activityList.checkTxAmountInActivity();
      },
    );
  });

  it('send ETH using a legacy transaction', async function () {
    await withSpeculosFixtures(
      {
        fixtures: new FixtureBuilderV2().withSpeculosLedgerAccount().build(),
        localNodeOptions: {
          hardfork: 'muirGlacier',
        },
        title: this.test?.fullTitle(),
        sharedContext: shared,
        seedBalances: LEDGER_SEED_BALANCE,
      },
      async ({ driver, interaction, apduBridge }) => {
        await login(driver, { validateBalance: false });
        await switchToHardwareAccount(driver, 'Ledger 1');

        const homePage = new HomePage(driver);
        await homePage.checkExpectedBalanceIsDisplayed('1.21M');

        const ledgerDone = approveTransaction(interaction, apduBridge);
        await sendRedesignedTransactionToAddress({
          driver,
          recipientAddress: RECIPIENT,
          amount: '1',
        });
        await ledgerDone;

        await homePage.checkPageIsLoaded();
        await homePage.goToActivityList();
        const activityList = new ActivityListPage(driver);
        await activityList.checkConfirmedTxNumberDisplayedInActivity();
        await activityList.checkTxAmountInActivity();
      },
    );
  });
});
