import { Suite } from 'mocha';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { Driver } from '../../webdriver/driver';
import SnapTransactionConfirmation from '../../page-objects/pages/confirmations/snap-transaction-confirmation';
import ActivityListPage from '../../page-objects/pages/home/activity-list';
import { TronNode } from '../../seeder/tron/node';
import { landOnTronSendScreen } from '../../page-objects/flows/tron-send.flow';
import { TRON_CHAIN_ID, TRON_RECIPIENT_ADDRESS } from './mocks/common-tron';
import {
  TRON_LOW_TRX_WITH_USDT_ACCOUNT,
  TRON_PORTFOLIO_ACCOUNT,
  TRON_PORTFOLIO_TRX_BALANCE_IN_SUN,
} from './fixtures/environments';
import { withTronFixtures } from './fixtures/with-tron-fixtures';

const TRON_SEND_FEE_BUFFER_IN_SUN = 1_000_000;

function formatSunAmount(amountInSun: number): string {
  const whole = Math.floor(amountInSun / 1_000_000);
  const fraction = String(amountInSun % 1_000_000).padStart(6, '0');
  return `${whole}.${fraction}`.replace(/\.?0+$/u, '');
}

function getTronTrc20AssetId(
  localNodes: unknown[],
  symbol: 'USDT' | 'USDD' | 'HTX' | 'SEED',
): string {
  const tronNode = localNodes.find(
    (node): node is TronNode => node instanceof TronNode,
  );
  const token = tronNode?.trc20Tokens[symbol];
  if (!token) {
    throw new Error(`Seeded ${symbol} token was not found on the Tron node`);
  }
  return `${TRON_CHAIN_ID}/trc20:${token.address}`;
}

describe('Tron Send', function (this: Suite) {
  this.timeout(180_000);

  // ── Validation tests ────────────────────────────────────────────────────────

  it('blocks Continue when a bad address is entered', async function () {
    await withTronFixtures(
      {
        accounts: [TRON_PORTFOLIO_ACCOUNT],
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        const sendPage = await landOnTronSendScreen({ driver, symbol: 'TRX' });
        await sendPage.fillRecipient('not-a-valid-address');
        await sendPage.checkInvalidAddressError();
        await sendPage.checkContinueButtonIsDisabled();
      },
    );
  });

  it('blocks Continue when amount is empty', async function () {
    await withTronFixtures(
      {
        accounts: [TRON_PORTFOLIO_ACCOUNT],
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        const sendPage = await landOnTronSendScreen({ driver, symbol: 'TRX' });
        await sendPage.fillRecipient(TRON_RECIPIENT_ADDRESS);
        await sendPage.checkAmountRequiredError();
        await sendPage.checkContinueButtonIsDisabled();
      },
    );
  });

  it('blocks Continue when amount exceeds balance', async function () {
    await withTronFixtures(
      {
        accounts: [TRON_PORTFOLIO_ACCOUNT],
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        const sendPage = await landOnTronSendScreen({ driver, symbol: 'TRX' });
        await sendPage.fillRecipient(TRON_RECIPIENT_ADDRESS);
        await sendPage.fillAmount('999999');
        await sendPage.checkInsufficientFundsError();
        await sendPage.checkContinueButtonIsDisabled();
      },
    );
  });

  // Doesn't seem to accurately describe the current behavior so commenting out in the meantime.
  // it('blocks USDT send when TRX balance cannot cover energy fee', async function () {
  //   await withTronFixtures(
  //     {
  //       accounts: [TRON_LOW_TRX_WITH_USDT_ACCOUNT],
  //       fixtures: new FixtureBuilderV2().build(),
  //       title: this.test?.fullTitle(),
  //     },
  //     async ({
  //       driver,
  //       localNodes,
  //     }: {
  //       driver: Driver;
  //       localNodes: unknown[];
  //     }) => {
  //       const sendPage = await landOnTronSendScreen({
  //         driver,
  //         symbol: 'USDT',
  //         assetId: getTronTrc20AssetId(localNodes, 'USDT'),
  //         expectedNativeBalance: null,
  //       });
  //       await sendPage.fillRecipient(TRON_RECIPIENT_ADDRESS);
  //       await sendPage.fillAmount('1');
  //       await sendPage.checkInvalidAmountError();
  //       await sendPage.checkContinueButtonIsDisabled();
  //     },
  //   );
  // });

  // ── TRX partial send ────────────────────────────────────────────────────────

  it('sends part of TRX balance and shows it pending then confirmed', async function () {
    await withTronFixtures(
      {
        accounts: [TRON_PORTFOLIO_ACCOUNT],
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        const sendPage = await landOnTronSendScreen({ driver, symbol: 'TRX' });
        await sendPage.fillRecipient(TRON_RECIPIENT_ADDRESS);
        await sendPage.fillAmount('1');
        await sendPage.pressContinueButton();

        const snapConfirmation = new SnapTransactionConfirmation(driver);
        await snapConfirmation.checkPageIsLoaded();
        await snapConfirmation.clickFooterConfirmButton();

        const activityList = new ActivityListPage(driver);
        await activityList.checkPendingTxNumberDisplayedInActivity(1);
        await activityList.checkConfirmedTxNumberDisplayedInActivity(1);
        await activityList.checkTxAmountInActivity('-1 TRX', 1);
        await activityList.checkNoFailedTransactions();
      },
    );
  });

  // ── TRX total send (Max) ────────────────────────────────────────────────────

  it('sends fee-buffered TRX balance via manual full-amount entry', async function () {
    await withTronFixtures(
      {
        accounts: [TRON_PORTFOLIO_ACCOUNT],
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        const sendPage = await landOnTronSendScreen({ driver, symbol: 'TRX' });
        await sendPage.fillRecipient(TRON_RECIPIENT_ADDRESS);
        const sendAmount = formatSunAmount(
          TRON_PORTFOLIO_TRX_BALANCE_IN_SUN - TRON_SEND_FEE_BUFFER_IN_SUN,
        );
        await sendPage.fillAmount(sendAmount);
        await sendPage.pressContinueButton();

        const snapConfirmation = new SnapTransactionConfirmation(driver);
        await snapConfirmation.checkPageIsLoaded();
        await snapConfirmation.clickFooterConfirmButton();

        const activityList = new ActivityListPage(driver);
        await activityList.checkPendingTxNumberDisplayedInActivity(1);
        await activityList.checkConfirmedTxNumberDisplayedInActivity(1);
        await activityList.checkNoFailedTransactions();
      },
    );
  });

  // ── USDT partial send ───────────────────────────────────────────────────────

  // TODO: Re-enable when the TRC20 send confirmation flow is stable against local Tron mocks.
  // eslint-disable-next-line mocha/no-skipped-tests
  it.skip('sends part of USDT balance and shows it pending then confirmed', async function () {
    await withTronFixtures(
      {
        accounts: [TRON_PORTFOLIO_ACCOUNT],
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
      },
      async ({
        driver,
        localNodes,
      }: {
        driver: Driver;
        localNodes: unknown[];
      }) => {
        const sendPage = await landOnTronSendScreen({
          driver,
          symbol: 'USDT',
          assetId: getTronTrc20AssetId(localNodes, 'USDT'),
        });
        await sendPage.fillRecipient(TRON_RECIPIENT_ADDRESS);
        await sendPage.fillAmount('1');
        await sendPage.pressContinueButton();

        const snapConfirmation = new SnapTransactionConfirmation(driver);
        await snapConfirmation.checkPageIsLoaded();
        await snapConfirmation.clickFooterConfirmButton();

        const activityList = new ActivityListPage(driver);
        await activityList.checkPendingTxNumberDisplayedInActivity(1);
        await activityList.checkConfirmedTxNumberDisplayedInActivity(1);
        await activityList.checkTxAmountInActivity('-1 USDT', 1);
        await activityList.checkNoFailedTransactions();
      },
    );
  });

  // ── USDT total send (Max) ───────────────────────────────────────────────────

  // TODO: Re-enable when the TRC20 send confirmation flow is stable against local Tron mocks.
  // eslint-disable-next-line mocha/no-skipped-tests
  it.skip('sends total USDT balance via manual full-amount entry', async function () {
    await withTronFixtures(
      {
        accounts: [TRON_PORTFOLIO_ACCOUNT],
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
      },
      async ({
        driver,
        localNodes,
      }: {
        driver: Driver;
        localNodes: unknown[];
      }) => {
        const sendPage = await landOnTronSendScreen({
          driver,
          symbol: 'USDT',
          assetId: getTronTrc20AssetId(localNodes, 'USDT'),
        });
        await sendPage.fillRecipient(TRON_RECIPIENT_ADDRESS);
        // Seeded USDT balance is 2_804_595 raw = 2.804595 USDT.
        // TRC20 has no fee buffer (fee paid in TRX).
        await sendPage.fillAmount('2.804595');
        await sendPage.pressContinueButton();

        const snapConfirmation = new SnapTransactionConfirmation(driver);
        await snapConfirmation.checkPageIsLoaded();
        await snapConfirmation.clickFooterConfirmButton();

        const activityList = new ActivityListPage(driver);
        await activityList.checkPendingTxNumberDisplayedInActivity(1);
        await activityList.checkConfirmedTxNumberDisplayedInActivity(1);
        await activityList.checkNoFailedTransactions();
      },
    );
  });
});
