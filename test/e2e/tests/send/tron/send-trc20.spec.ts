import { Suite } from 'mocha';
import FixtureBuilderV2 from '../../../fixtures/fixture-builder-v2';
import { Driver } from '../../../webdriver/driver';
import { TronNode } from '../../../seeder/tron/node';
import {
  confirmTronSendAndAssertActivity,
  landOnTronSendScreen,
} from '../../../page-objects/flows/tron-send.flow';
import {
  TRON_CHAIN_ID,
  TRON_RECIPIENT_ADDRESS,
} from '../../tron/mocks/common-tron';
import {
  TRON_LOW_TRX_WITH_USDT_ACCOUNT,
  TRON_PORTFOLIO_ACCOUNT,
} from '../../tron/fixtures/environments';
import { withTronFixtures } from '../../tron/fixtures/with-tron-fixtures';

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

  // ── TRC20 fee cover ─────────────────────────────────────────────────────────

  it('blocks USDT send when TRX balance cannot cover energy fee', async function () {
    await withTronFixtures(
      {
        accounts: [TRON_LOW_TRX_WITH_USDT_ACCOUNT],
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
          expectedNativeBalance: null,
        });
        await sendPage.fillRecipient({
          recipientAddress: TRON_RECIPIENT_ADDRESS,
        });
        await sendPage.fillAmount('1');
        // With 1 sun TRX, Continuetrial builds the TRC20 tx then fails fee cover.
        await sendPage.pressContinueButton();
        await sendPage.checkInsufficientBalanceToCoverFeesError();
        await sendPage.checkContinueButtonIsDisabled();
      },
    );
  });

  // ── USDT partial send ───────────────────────────────────────────────────────

  it('sends part of USDT balance and shows it pending then confirmed', async function () {
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
          // Homepage rounds 2.804595 → 2.805 (same as assets.spec.ts).
          expectedTokenBalance: '2.805',
        });
        await sendPage.fillRecipient({
          recipientAddress: TRON_RECIPIENT_ADDRESS,
        });
        await sendPage.fillAmount('1');
        await sendPage.waitForSendAmountBalance();
        await sendPage.pressContinueButton();

        await confirmTronSendAndAssertActivity({
          driver,
          expectedAmount: '-1 USDT',
        });
      },
    );
  });

  // ── USDT total send (Max) ───────────────────────────────────────────────────

  it('sends total USDT balance via manual full-amount entry', async function () {
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
          // Homepage rounds 2.804595 → 2.805 (same as assets.spec.ts).
          expectedTokenBalance: '2.805',
        });
        await sendPage.fillRecipient({
          recipientAddress: TRON_RECIPIENT_ADDRESS,
        });
        // Seeded USDT balance is 2_804_595 raw = 2.804595 USDT.
        // TRC20 has no fee buffer (fee paid in TRX).
        await sendPage.fillAmount('2.804595');
        await sendPage.waitForSendAmountBalance();
        await sendPage.pressContinueButton();

        // Activity may round the amount; presence + confirmed status is enough.
        await confirmTronSendAndAssertActivity({ driver });
      },
    );
  });
});
