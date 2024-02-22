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

const FixtureBuilder = require('../fixture-builder');
const {
  ENTRYPOINT,
  ERC_4337_ACCOUNT_SNAP_URL,
  BUNDLER_URL,
  SIMPLE_ACCOUNT_FACTORY,
  GANACHE_PRIVATE_KEY,
  ERC_4337_ACCOUNT_SALT,
  ERC_4337_ACCOUNT,
  GANACHE_ACCOUNT,
  VERIFYING_PAYMASTER,
} = require('../constants');
const { buildQuote, reviewQuote } = require('../tests/swaps/shared');

async function installExampleSnap(driver) {
  // Navigate to Site
  await driver.openNewPage(ERC_4337_ACCOUNT_SNAP_URL);
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

async function createSnapAccount(driver, privateKey, salt) {
  await driver.switchToWindowWithTitle('Account Abstraction Snap');
  await driver.clickElement({ text: 'Create account' });
  await driver.fill('#create-account-private-key', privateKey);
  await driver.fill('#create-account-salt', salt);
  await driver.clickElement({ text: 'Create Account', tag: 'button' });
  await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
  await driver.clickElement({ text: 'Create', tag: 'button' });
  await driver.clickElement({ text: 'Ok', tag: 'button' });
  await driver.switchToWindowWithTitle('Account Abstraction Snap');
}

async function setSnapConfig(
  driver,
  { bundlerUrl, entrypoint, simpleAccountFactory, paymaster },
) {
  const data = JSON.stringify({
    bundlerUrl,
    entryPoint: entrypoint,
    simpleAccountFactory,
    customVerifyingPaymasterAddress: paymaster,
  });

  await driver.switchToWindowWithTitle('Account Abstraction Snap');
  await driver.clickElement({ text: 'Set Chain Config' });
  await driver.fill('#set-chain-config-chain-config-object', data);
  await driver.clickElement({ text: 'Set Chain Configs', tag: 'button' });
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
  await switchToExtensionWindow(driver);
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

async function withAccountSnap({ currentTest, paymaster }, createTransaction) {
  await withFixtures(
    {
      fixtures: new FixtureBuilder()
        .withPermissionControllerConnectedToTestDapp()
        .build(),
      title: currentTest.fullTitle(),
      useBundler: true,
      usePaymaster: Boolean(paymaster),
      dapp: true,
      ganacheOptions: {
        hardfork: 'london',
      },
    },
    async ({ driver, bundlerServer }) => {
      await unlockWallet(driver);
      await installExampleSnap(driver);

      await setSnapConfig(driver, {
        bundlerUrl: BUNDLER_URL,
        entrypoint: ENTRYPOINT,
        simpleAccountFactory: SIMPLE_ACCOUNT_FACTORY,
        paymaster,
      });

      await createSnapAccount(
        driver,
        GANACHE_PRIVATE_KEY,
        ERC_4337_ACCOUNT_SALT,
      );

      await createTransaction(driver);
      await openConfirmedTransaction(driver);
      await expectTransactionDetails(driver, bundlerServer);
    },
  );
}

describe('User Operations', function () {
  it('from dApp transaction', async function () {
    await withAccountSnap({ currentTest: this.test }, async (driver) => {
      await createDappTransaction(driver, {
        from: ERC_4337_ACCOUNT,
        to: GANACHE_ACCOUNT,
        value: convertETHToHexGwei(1),
        data: '0x',
      });

      await confirmTransaction(driver);
    });
  });

  it('from send transaction', async function () {
    if (process.env.MULTICHAIN) {
      return;
    }

    await withAccountSnap({ currentTest: this.test }, async (driver) => {
      await switchToExtensionWindow(driver);
      await sendTransaction(
        driver,
        GANACHE_ACCOUNT,
        convertETHToHexGwei(1),
        true,
      );
    });
  });

  it('from swap', async function () {
    await withAccountSnap({ currentTest: this.test }, async (driver) => {
      await createSwap(driver);
    });
  });

  it('with paymaster', async function () {
    await withAccountSnap(
      { currentTest: this.test, paymaster: VERIFYING_PAYMASTER },
      async (driver) => {
        await createDappTransaction(driver, {
          from: ERC_4337_ACCOUNT,
          to: GANACHE_ACCOUNT,
          value: convertETHToHexGwei(1),
          data: '0x',
        });

        await confirmTransaction(driver);
      },
    );
  });
});
