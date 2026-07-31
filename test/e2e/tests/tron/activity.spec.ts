import { Suite } from 'mocha';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { Driver } from '../../webdriver/driver';
import { login } from '../../page-objects/flows/login.flow';
import { selectTronNetwork } from '../../page-objects/flows/tron-network.flow';
import ActivityTab from '../../page-objects/pages/home/activity-tab';
import HomePage from '../../page-objects/pages/home/homepage';
import TransactionDetailsPage from '../../page-objects/pages/transaction-details-page';
import {
  TRON_ACCOUNT_ADDRESS,
  TRON_RECIPIENT_ADDRESS,
  SUN_PER_TRX,
} from './mocks/common-tron';
import { TRON_PORTFOLIO_ACCOUNT } from './fixtures/environments';
import { withTronFixtures } from './fixtures/with-tron-fixtures';
import {
  trxSendTx,
  trc20SendTx,
} from './mocks/tron-tx-fixtures';

const TRON_EXPLORER_BASE = 'https://tronscan.org';

async function landOnTronActivity(driver: Driver): Promise<HomePage> {
  await login(driver, { validateBalance: false });
  await selectTronNetwork(driver);
  await driver.refresh();
  const homePage = new HomePage(driver);
  await homePage.checkPageIsLoaded();
  await homePage.goToActivityList();
  return homePage;
}

describe('Tron - Activity', function (this: Suite) {
  this.timeout(180_000);

  it('shows confirmed TRX send in activity list and details', async function () {
    const sendTx = trxSendTx({
      amountSun: SUN_PER_TRX,
      to: TRON_RECIPIENT_ADDRESS,
      status: 'Confirmed',
    });

    await withTronFixtures(
      {
        accounts: [
          {
            ...TRON_PORTFOLIO_ACCOUNT,
            transactions: { raw: [sendTx], trc20: [] },
          },
        ],
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await landOnTronActivity(driver);

        const activity = new ActivityTab(driver);
        await activity.checkConfirmedTxNumberDisplayedInActivity(1);
        await activity.checkTxAction({
          action: 'Sent TRX',
          txIndex: 1,
          confirmedTx: 1,
        });
        await activity.checkTxAmountInActivity('-1 TRX', 1);
        await activity.checkNoFailedTransactions();
        await activity.clickOnActivity(1);

        const details = new TransactionDetailsPage(driver);
        await details.checkPageIsLoaded();
        await details.checkTitle('Sent TRX');
        await details.checkTime();
        await details.checkStatusByTestId('success');
        await details.checkAmount('-1 TRX');
        await details.checkAddressInLog(TRON_RECIPIENT_ADDRESS);
        await details.checkAddressInLog(TRON_ACCOUNT_ADDRESS);
        await details.checkHashLinkPresent();
        await details.checkExplorerUrl(
          `${TRON_EXPLORER_BASE}/#/transaction/${sendTx.txID}`,
        );
        await details.checkViewDetailsLink();
      },
    );
  });

  it('shows confirmed USDT transfer in activity list and details', async function () {
    const usdtSend = trc20SendTx({
      symbol: 'USDT',
      amount: '1000000',
      to: TRON_RECIPIENT_ADDRESS,
      status: 'Confirmed',
    });

    await withTronFixtures(
      {
        accounts: [
          {
            ...TRON_PORTFOLIO_ACCOUNT,
            transactions: {
              raw: [usdtSend.raw],
              trc20: [usdtSend.trc20],
            },
          },
        ],
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await landOnTronActivity(driver);

        const activity = new ActivityTab(driver);
        await activity.checkConfirmedTxNumberDisplayedInActivity(1);
        await activity.checkTxAction({
          action: 'Sent USDT',
          txIndex: 1,
          confirmedTx: 1,
        });
        await activity.checkTxAmountInActivity('-1 USDT', 1);
        await activity.clickOnActivity(1);

        const details = new TransactionDetailsPage(driver);
        await details.checkPageIsLoaded();
        await details.checkStatusByTestId('success');
        await details.checkAmount('-1 USDT');
        await details.checkExplorerUrl(
          `${TRON_EXPLORER_BASE}/#/transaction/${usdtSend.trc20.transaction_id}`,
        );
        await details.checkViewDetailsLink();
      },
    );
  });

  it('shows failed TRX send in activity list and details', async function () {
    const failedSend = trxSendTx({
      amountSun: SUN_PER_TRX,
      to: TRON_RECIPIENT_ADDRESS,
      status: 'Failed',
    });

    await withTronFixtures(
      {
        accounts: [
          {
            ...TRON_PORTFOLIO_ACCOUNT,
            transactions: { raw: [failedSend], trc20: [] },
          },
        ],
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await landOnTronActivity(driver);

        const activity = new ActivityTab(driver);
        await activity.checkFailedTxNumberDisplayedInActivity(1);
        await activity.checkTxAction({
          action: 'Send failed',
          confirmedTx: 0,
        });
        await activity.clickOnActivity(1);

        const details = new TransactionDetailsPage(driver);
        await details.checkPageIsLoaded();
        await details.checkTitle('Send failed');
        await details.checkStatusByTestId('failed');
        await details.checkExplorerUrl(
          `${TRON_EXPLORER_BASE}/#/transaction/${failedSend.txID}`,
        );
        await details.checkViewDetailsLink();
      },
    );
  });

  // Failed TRC20 sends (TriggerSmartContract + OUT_OF_ENERGY) are not yet mapped to
  // an activity row by the Tron snap — failed TRX send above covers failed details UX.
});
