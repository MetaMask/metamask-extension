const {
  withFixtures,
  unlockWallet,
  openDapp,
  switchToNotificationWindow,
  DAPP_URL,
  WINDOW_TITLES,
  sendTransaction,
  DEFAULT_FIXTURE_ACCOUNT,
  convertETHToHexGwei,
} = require('../helpers');

const FixtureBuilder = require('../fixture-builder');

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

describe('User Operations', function () {
  it('from dApp transaction', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder()
          .withPermissionControllerConnectedToTestDapp()
          .build(),
        title: this.test.fullTitle(),
        useBundler: true,
        dapp: true,
        ganacheOptions: {
          hardfork: 'london',
        },
      },
      async ({ driver }) => {
        await unlockWallet(driver);

        await createDappTransaction(driver, {
          from: DEFAULT_FIXTURE_ACCOUNT,
          to: DEFAULT_FIXTURE_ACCOUNT,
          value: convertETHToHexGwei(1),
          data: '0x',
        });

        await confirmTransaction(driver);
        await switchToExtension(driver);
        await openConfirmedTransaction(driver);

        await expectTransactionDetail(driver, 0, '0'); // Nonce
      },
    );
  });

  it('from send transaction', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        title: this.test.fullTitle(),
        useBundler: true,
        ganacheOptions: {
          hardfork: 'london',
        },
      },
      async ({ driver }) => {
        await unlockWallet(driver);

        await sendTransaction(
          driver,
          DEFAULT_FIXTURE_ACCOUNT,
          convertETHToHexGwei(1),
          true,
        );

        await openConfirmedTransaction(driver);

        await expectTransactionDetail(driver, 0, '0'); // Nonce
      },
    );
  });
});
