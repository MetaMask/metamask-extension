import { Suite } from 'mocha';
import { withFixtures } from '../../../helpers';
import ActivityTab from '../../../page-objects/pages/home/activity-tab';
import HomePage from '../../../page-objects/pages/home/homepage';
import { sendRedesignedTransactionToAddress } from '../../../page-objects/flows/send-transaction.flow';
import { login } from '../../../page-objects/flows/login.flow';
import {
  buildLedgerFixtures,
  LEDGER_LOGIN_EXPECTED_BALANCE,
  mockLedgerHardwareEndpoints,
  seedLedgerAccountBalance,
} from './ledger-test-helpers';

const RECIPIENT = '0x0Cc5261AB8cE458dc977078A3623E2BaDD27afD3';

describe('Ledger Hardware', function (this: Suite) {
  it('send ETH using an EIP1559 transaction', async function () {
    await withFixtures(
      {
        fixtures: buildLedgerFixtures(),
        localNodeOptions: {
          hardfork: 'london',
        },
        title: this.test?.fullTitle(),
        testSpecificMock: mockLedgerHardwareEndpoints,
      },
      async ({ driver, localNodes }) => {
        await seedLedgerAccountBalance(localNodes);
        await login(driver, {
          expectedBalance: LEDGER_LOGIN_EXPECTED_BALANCE,
          waitForNonEvmAccounts: false,
        });
        const homePage = new HomePage(driver);
        await sendRedesignedTransactionToAddress({
          driver,
          recipientAddress: RECIPIENT,
          amount: '1',
        });
        await homePage.checkPageIsLoaded();
        await homePage.goToActivityList();
        const activityTab = new ActivityTab(driver);
        await activityTab.checkConfirmedTxNumberDisplayedInActivity();
        await activityTab.checkTxAmountInActivity();
      },
    );
  });
  it('send ETH using a legacy transaction', async function () {
    await withFixtures(
      {
        fixtures: buildLedgerFixtures(),
        localNodeOptions: {
          hardfork: 'muirGlacier',
        },
        title: this.test?.fullTitle(),
        testSpecificMock: mockLedgerHardwareEndpoints,
      },
      async ({ driver, localNodes }) => {
        await seedLedgerAccountBalance(localNodes);
        await login(driver, {
          expectedBalance: LEDGER_LOGIN_EXPECTED_BALANCE,
          waitForNonEvmAccounts: false,
        });
        const homePage = new HomePage(driver);
        await sendRedesignedTransactionToAddress({
          driver,
          recipientAddress: RECIPIENT,
          amount: '1',
        });
        await homePage.checkPageIsLoaded();
        await homePage.goToActivityList();
        const activityTab = new ActivityTab(driver);
        await activityTab.checkConfirmedTxNumberDisplayedInActivity();
        await activityTab.checkTxAmountInActivity();
      },
    );
  });
});
