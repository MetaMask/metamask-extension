import { Suite } from 'mocha';
import { EXPECTED_TRON_ADDRESSES_BY_INDEX } from '../../constants';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import {
  confirmTronSendAndAssertActivity,
  landOnTronSendScreen,
} from '../../page-objects/flows/tron-send.flow';
import { TronNode } from '../../seeder/tron/node';
import { Driver } from '../../webdriver/driver';
import {
  TRON_LOW_TRX_WITH_USDT_ACCOUNT,
  TRON_PORTFOLIO_ACCOUNT,
  TRON_PORTFOLIO_TRX_BALANCE_IN_SUN,
} from './fixtures/environments';
import {
  buildTronNodeOptions,
  type TronFixtureAccount,
  withTronFixtures,
} from './fixtures/with-tron-fixtures';
import { TRON_CHAIN_ID, TRON_RECIPIENT_ADDRESS } from './mocks/common-tron';

const TRON_SEND_FEE_BUFFER_IN_SUN = 1_000_000;

function buildTronAccount(
  profile: TronFixtureAccount,
  index: number,
): TronFixtureAccount {
  return {
    ...profile,
    address: EXPECTED_TRON_ADDRESSES_BY_INDEX[index],
    assets: profile.assets?.map((asset) => ({ ...asset })),
  };
}

const TRON_BAD_ADDRESS_ACCOUNTS = [buildTronAccount(TRON_PORTFOLIO_ACCOUNT, 0)];
const TRON_EMPTY_AMOUNT_ACCOUNTS = [
  buildTronAccount(TRON_PORTFOLIO_ACCOUNT, 1),
];
const TRON_EXCESSIVE_AMOUNT_ACCOUNTS = [
  buildTronAccount(TRON_PORTFOLIO_ACCOUNT, 2),
];
const TRON_LOW_FEE_ACCOUNTS = [
  buildTronAccount(TRON_LOW_TRX_WITH_USDT_ACCOUNT, 3),
];
const TRON_PARTIAL_TRX_ACCOUNTS = [buildTronAccount(TRON_PORTFOLIO_ACCOUNT, 4)];
const TRON_FULL_TRX_ACCOUNTS = [buildTronAccount(TRON_PORTFOLIO_ACCOUNT, 5)];
const TRON_PARTIAL_USDT_ACCOUNTS = [
  buildTronAccount(TRON_PORTFOLIO_ACCOUNT, 6),
];
const TRON_FULL_USDT_ACCOUNTS = [buildTronAccount(TRON_PORTFOLIO_ACCOUNT, 7)];

const TRON_SEND_ACCOUNTS = [
  ...TRON_BAD_ADDRESS_ACCOUNTS,
  ...TRON_EMPTY_AMOUNT_ACCOUNTS,
  ...TRON_EXCESSIVE_AMOUNT_ACCOUNTS,
  ...TRON_LOW_FEE_ACCOUNTS,
  ...TRON_PARTIAL_TRX_ACCOUNTS,
  ...TRON_FULL_TRX_ACCOUNTS,
  ...TRON_PARTIAL_USDT_ACCOUNTS,
  ...TRON_FULL_USDT_ACCOUNTS,
];

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
  this.timeout(300_000);

  const sharedTronNode = new TronNode();

  before('Start shared Tron node', async function () {
    await sharedTronNode.start(buildTronNodeOptions(TRON_SEND_ACCOUNTS));
  });

  after('Stop shared Tron node', async function () {
    await sharedTronNode.quit();
  });

  it('blocks Continue when a bad address is entered', async function () {
    await withTronFixtures(
      {
        accounts: TRON_BAD_ADDRESS_ACCOUNTS,
        borrowedTronNode: sharedTronNode,
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        const sendPage = await landOnTronSendScreen({
          accountIndex: 0,
          driver,
          symbol: 'TRX',
        });
        await sendPage.fillRecipient({
          recipientAddress: 'not-a-valid-address',
          // The formatted recipient element never renders for an invalid
          // address, so skip the post-paste re-render wait.
          validAddress: false,
        });
        await sendPage.checkInvalidAddressError();
        await sendPage.checkContinueButtonIsDisabled();
      },
    );
  });

  it('blocks Continue when amount is empty', async function () {
    await withTronFixtures(
      {
        accounts: TRON_EMPTY_AMOUNT_ACCOUNTS,
        borrowedTronNode: sharedTronNode,
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        const sendPage = await landOnTronSendScreen({
          accountIndex: 1,
          driver,
          symbol: 'TRX',
        });
        await sendPage.fillRecipient({
          recipientAddress: TRON_RECIPIENT_ADDRESS,
        });
        // Empty amount leaves Continue enabled; Tron snap rejects on submit and
        // surfaces transactionError on the Continue button.
        await sendPage.pressContinueButton();
        await sendPage.checkTransactionError();
        await sendPage.checkContinueButtonIsDisabled();
      },
    );
  });

  it('blocks Continue when amount exceeds balance', async function () {
    await withTronFixtures(
      {
        accounts: TRON_EXCESSIVE_AMOUNT_ACCOUNTS,
        borrowedTronNode: sharedTronNode,
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        const sendPage = await landOnTronSendScreen({
          accountIndex: 2,
          driver,
          symbol: 'TRX',
        });
        await sendPage.fillRecipient({
          recipientAddress: TRON_RECIPIENT_ADDRESS,
        });
        await sendPage.fillAmount('999999');
        await sendPage.checkInsufficientFundsError();
        await sendPage.checkContinueButtonIsDisabled();
      },
    );
  });

  it('blocks USDT send when TRX balance cannot cover energy fee', async function () {
    await withTronFixtures(
      {
        accounts: TRON_LOW_FEE_ACCOUNTS,
        borrowedTronNode: sharedTronNode,
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
          accountIndex: 3,
          assetId: getTronTrc20AssetId(localNodes, 'USDT'),
          driver,
          expectedNativeBalance: null,
          symbol: 'USDT',
        });
        await sendPage.fillRecipient({
          recipientAddress: TRON_RECIPIENT_ADDRESS,
        });
        await sendPage.fillAmount('1');
        // With 1 sun TRX, Continue builds the TRC20 transaction then fails fee cover.
        await sendPage.pressContinueButton();
        await sendPage.checkInsufficientBalanceToCoverFeesError();
        await sendPage.checkContinueButtonIsDisabled();
      },
    );
  });

  it('sends part of TRX balance and shows it pending then confirmed', async function () {
    await withTronFixtures(
      {
        accounts: TRON_PARTIAL_TRX_ACCOUNTS,
        borrowedTronNode: sharedTronNode,
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        const sendPage = await landOnTronSendScreen({
          accountIndex: 4,
          driver,
          symbol: 'TRX',
        });
        await sendPage.fillRecipient({
          recipientAddress: TRON_RECIPIENT_ADDRESS,
        });
        await sendPage.fillAmount('1');
        await sendPage.pressContinueButton();

        await confirmTronSendAndAssertActivity({
          driver,
          expectedAmount: '-1 TRX',
        });
      },
    );
  });

  it('sends fee-buffered TRX balance via manual full-amount entry', async function () {
    await withTronFixtures(
      {
        accounts: TRON_FULL_TRX_ACCOUNTS,
        borrowedTronNode: sharedTronNode,
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        const sendPage = await landOnTronSendScreen({
          accountIndex: 5,
          driver,
          symbol: 'TRX',
        });
        await sendPage.fillRecipient({
          recipientAddress: TRON_RECIPIENT_ADDRESS,
        });
        const sendAmount = formatSunAmount(
          TRON_PORTFOLIO_TRX_BALANCE_IN_SUN - TRON_SEND_FEE_BUFFER_IN_SUN,
        );
        await sendPage.fillAmount(sendAmount);
        await sendPage.pressContinueButton();

        await confirmTronSendAndAssertActivity({ driver });
      },
    );
  });

  it('sends part of USDT balance and shows it pending then confirmed', async function () {
    await withTronFixtures(
      {
        accounts: TRON_PARTIAL_USDT_ACCOUNTS,
        borrowedTronNode: sharedTronNode,
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
          accountIndex: 6,
          assetId: getTronTrc20AssetId(localNodes, 'USDT'),
          driver,
          // Homepage rounds 2.804595 → 2.805 (same as assets.spec.ts).
          expectedTokenBalance: '2.805',
          symbol: 'USDT',
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

  it('sends total USDT balance via manual full-amount entry', async function () {
    await withTronFixtures(
      {
        accounts: TRON_FULL_USDT_ACCOUNTS,
        borrowedTronNode: sharedTronNode,
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
          accountIndex: 7,
          assetId: getTronTrc20AssetId(localNodes, 'USDT'),
          driver,
          // Homepage rounds 2.804595 → 2.805 (same as assets.spec.ts).
          expectedTokenBalance: '2.805',
          symbol: 'USDT',
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
