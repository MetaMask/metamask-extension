const {
  withFixtures,
  unlockWallet,
  openDapp,
  switchToNotificationWindow,
  DAPP_URL,
  WINDOW_TITLES,
  sendTransaction,
  convertETHToHexGwei,
  PRIVATE_KEY,
} = require('../helpers');

const FixtureBuilder = require('../fixture-builder');
const { DEFAULT_FIXTURE_ACCOUNT, SENDER } = require('../constants');
const { buildQuote, reviewQuote } = require('../tests/swaps/shared');

async function installExampleSnap(driver) {
  // Navigate to Site
  await driver.openNewPage('http://localhost:8001');
  await driver.delay(1000);

  // Click Connect Button
  await driver.clickElement('#connectButton');
  await driver.delay(1000);

  // Confirm Connect Modal
  await switchToNotificationWindow(driver, 3);
  await driver.clickElement({
    text: 'Connect',
    tag: 'button',
  });

  // Scroll Down
  await driver.clickElementSafe('[data-testid="snap-install-scroll"]');

  // Confirm Install Modal
  await driver.clickElement({
    text: 'Install',
    tag: 'button',
  });

  // Success Modal
  await driver.clickElement({
    text: 'OK',
    tag: 'button',
  });
}

async function createSnapAccount(driver, privateKey) {
  await driver.switchToWindowWithTitle('Account Abstraction Snap');
  await driver.clickElement({ text: 'Create account' });
  await driver.fill('#create-account-private-key', privateKey);
  await driver.clickElement({ text: 'Create Account', tag: 'button' });
  await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
  await driver.clickElement({ text: 'Create', tag: 'button' });
  await driver.clickElement({ text: 'Ok', tag: 'button' });
}

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

async function createSwap(driver) {
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
}

async function confirmTransaction(driver) {
  await switchToNotificationWindow(driver, 4);
  await driver.clickElement({ text: 'Confirm' });
}

async function openConfirmedTransaction(driver) {
  await switchToExtensionWindow(driver);
  await driver.clickElement('[data-testid="home__activity-tab"]');

  await driver.clickElement({
    css: '[data-testid="activity-list-item"]',
    text: 'Confirmed',
  });
}

async function switchToExtensionWindow(driver) {
  await driver.switchToWindowWithTitle(WINDOW_TITLES.ExtensionInFullScreenView);
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

  const userOperationHash = await bundlerServer.getUserOperationHashes()[0];

  if (!userOperationHash) {
    throw new Error('No user operation hash found');
  }

  const receipt = await bundlerServer.getUserOperationReceipt(
    userOperationHash,
  );

  if (!receipt) {
    throw new Error('No user operation receipt found');
  }

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
        await installExampleSnap(driver);
        await createSnapAccount(driver, PRIVATE_KEY);

        await createDappTransaction(driver, {
          from: SENDER,
          to: DEFAULT_FIXTURE_ACCOUNT,
          value: convertETHToHexGwei(1),
          data: '0x',
        });

        await confirmTransaction(driver);
        await openConfirmedTransaction(driver);
        await expectTransactionDetails(driver, bundlerServer);
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
      async ({ driver, bundlerServer }) => {
        if (process.env.MULTICHAIN) {
          return;
        }

        await unlockWallet(driver);
        await installExampleSnap(driver);
        await createSnapAccount(driver, PRIVATE_KEY);
        await switchToExtensionWindow(driver);

        await sendTransaction(
          driver,
          DEFAULT_FIXTURE_ACCOUNT,
          convertETHToHexGwei(1),
          true,
        );

        await openConfirmedTransaction(driver);
        await expectTransactionDetails(driver, bundlerServer);
      },
    );
  });

  it('from swap', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        title: this.test.fullTitle(),
        useBundler: true,
        ganacheOptions: {
          hardfork: 'london',
        },
      },
      async ({ driver, bundlerServer }) => {
        await unlockWallet(driver);
        await installExampleSnap(driver);
        await createSnapAccount(driver, PRIVATE_KEY);
        await switchToExtensionWindow(driver);
        await createSwap(driver);
        await openConfirmedTransaction(driver);
        await expectTransactionDetails(driver, bundlerServer);
      },
    );
  });
});
