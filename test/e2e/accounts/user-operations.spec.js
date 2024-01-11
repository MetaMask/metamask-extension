const {
  withFixtures,
  unlockWallet,
  openDapp,
  switchToNotificationWindow,
  DAPP_URL,
  WINDOW_TITLES,
  sendTransaction,
  convertETHToHexGwei,
} = require('../helpers');

const USER_OPERATION_HASH =
  '0x45fe99ef2a6d7993da06a2b3972bd00bd67006a825c8cac823191e9562899940';

const FixtureBuilder = require('../fixture-builder');
const { DEFAULT_FIXTURE_ACCOUNT } = require('../constants');
const { buildQuote, reviewQuote } = require('../tests/swaps/shared');

async function createDappTransaction(driver, transaction) {
  await openDapp(
    driver,
    null,
    `${DAPP_URL}/request?method=eth_sendTransaction&params=${JSON.stringify([
      transaction,
    ])}`,
  );

  await new Promise((resolve) => setTimeout(resolve, 5000));
}

async function confirmTransaction(driver) {
  await switchToNotificationWindow(driver, 3);
  await driver.clickElement({ text: 'Confirm' });
}

async function switchToExtension(driver) {
  const windowHandles = await driver.waitUntilXWindowHandles(2);

  await driver.switchToWindowWithTitle(
    WINDOW_TITLES.ExtensionInFullScreenView,
    windowHandles,
  );
}

async function openConfirmedTransaction(driver) {
  await driver.clickElement('[data-testid="home__activity-tab"]');

  await driver.clickElement({
    css: '[data-testid="activity-list-item"]',
    text: 'Confirmed',
  });
}

async function expectTransactionDetail(driver, rowIndex, expectedText) {
  await driver.findElement({
    css: `[data-testid="transaction-breakdown-row"]:nth-child(${
      2 + rowIndex
    }) [data-testid="transaction-breakdown-row-value"]`,
    text: expectedText,
  });
}

async function expectTransactionDetails(driver, bundlerServer) {
  const hexToDecimalString = (hex) => String(parseInt(hex, 16));

  const receipt = await bundlerServer.getUserOperationReceipt(
    USER_OPERATION_HASH,
  );

  await expectTransactionDetail(driver, 0, hexToDecimalString(receipt.nonce));

  await expectTransactionDetail(
    driver,
    3,
    hexToDecimalString(receipt.actualGasUsed),
  );
}

describe('User Operations', function () {
  it('from dApp transaction', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder()
          .with4337Account()
          .withPermissionControllerConnectedToTestDapp()
          .build(),
        title: this.test.fullTitle(),
        useBundler: true,
        dapp: true,
        ganacheOptions: {
          hardfork: 'london',
        },
      },
      async ({ driver, bundlerServer }) => {
        await unlockWallet(driver);

        await createDappTransaction(driver, {
          from: '0x03f522D61308F19aE950DFf351179434bAb665E8',
          to: DEFAULT_FIXTURE_ACCOUNT,
          value: convertETHToHexGwei(1),
          data: '0x',
        });

        await confirmTransaction(driver);
        await switchToExtension(driver);
        await openConfirmedTransaction(driver);

        expectTransactionDetails(driver, bundlerServer);
      },
    );
  });

  it('from send transaction', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().with4337Account().build(),
        title: this.test.fullTitle(),
        useBundler: true,
        ganacheOptions: {
          hardfork: 'london',
        },
      },
      async ({ driver, bundlerServer }) => {
        if (process.env.MULTICHAIN) {
          return;
        }

        await unlockWallet(driver);

        await sendTransaction(
          driver,
          DEFAULT_FIXTURE_ACCOUNT,
          convertETHToHexGwei(1),
          true,
        );

        await openConfirmedTransaction(driver);

        expectTransactionDetails(driver, bundlerServer);
      },
    );
  });

  it('from swap', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().with4337Account().build(),
        title: this.test.fullTitle(),
        useBundler: true,
        ganacheOptions: {
          hardfork: 'london',
        },
      },
      async ({ driver, bundlerServer }) => {
        await unlockWallet(driver);
        await buildQuote(driver, {
          amount: 0.001,
          swapTo: 'USDC',
        });
        await reviewQuote(driver, {
          amount: 0.001,
          swapFrom: 'TESTETH',
          swapTo: 'USDC',
        });
        await driver.clickElement({ text: 'Swap', tag: 'button' });
        await driver.clickElement({ text: 'Close', tag: 'button' });

        await openConfirmedTransaction(driver);

        expectTransactionDetails(driver, bundlerServer);
      },
    );
  });
});
