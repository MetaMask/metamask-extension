import { TransactionParams } from '@metamask/transaction-controller';
import {
  withFixtures,
  unlockWallet,
  openDapp,
  switchToNotificationWindow,
  DAPP_URL,
  WINDOW_TITLES,
  sendTransaction,
  convertETHToHexGwei,
} from '../helpers';
import FixtureBuilder from '../fixture-builder';
import {
  ENTRYPOINT,
  ERC_4337_ACCOUNT_SNAP_URL,
  BUNDLER_URL,
  SIMPLE_ACCOUNT_FACTORY,
  GANACHE_PRIVATE_KEY,
  ERC_4337_ACCOUNT_SALT,
  ERC_4337_ACCOUNT,
  GANACHE_ACCOUNT,
  VERIFYING_PAYMASTER,
} from '../constants';
import { buildQuote, reviewQuote } from '../tests/swaps/shared';
import { Driver } from '../webdriver/driver';
import { Bundler } from '../bundler';

enum TransactionDetailRowIndex {
  Nonce = 0,
  GasUsed = 3,
}

async function installExampleSnap(driver: Driver) {
  await driver.openNewPage(ERC_4337_ACCOUNT_SNAP_URL);
  await driver.clickElement('#connectButton');
  await switchToNotificationWindow(driver);
  await driver.clickElement({
    text: 'Connect',
    tag: 'button',
  });
  await driver.findElement({ text: 'Installation request', tag: 'h2' });
  await driver.clickElementSafe('[data-testid="snap-install-scroll"]');
  await driver.clickElement({
    text: 'Install',
    tag: 'button',
  });
  await driver.clickElement({
    text: 'OK',
    tag: 'button',
  });
}

async function createSnapAccount(
  driver: Driver,
  privateKey: string,
  salt: string,
) {
  await driver.switchToWindowWithTitle(WINDOW_TITLES.ERC4337Snap);
  await driver.clickElement({ text: 'Create account' });
  await driver.fill('#create-account-private-key', privateKey);
  await driver.fill('#create-account-salt', salt);
  await driver.clickElement({ text: 'Create Account', tag: 'button' });
  await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
  await driver.clickElement({ text: 'Create', tag: 'button' });
  await driver.clickElement({ text: 'Ok', tag: 'button' });
  await driver.switchToWindowWithTitle(WINDOW_TITLES.ERC4337Snap);
}

async function setSnapConfig(
  driver: Driver,
  {
    bundlerUrl,
    entrypoint,
    simpleAccountFactory,
    paymaster,
  }: {
    bundlerUrl: string;
    entrypoint: string;
    simpleAccountFactory: string;
    paymaster?: string;
  },
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

async function createDappTransaction(
  driver: Driver,
  transaction: TransactionParams,
) {
  await openDapp(
    driver,
    null,
    `${DAPP_URL}/request?method=eth_sendTransaction&params=${JSON.stringify([
      transaction,
    ])}`,
  );
}

async function createSwap(driver: Driver) {
  await driver.switchToWindowWithTitle(WINDOW_TITLES.ExtensionInFullScreenView);
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

async function confirmTransaction(driver: Driver) {
  await switchToNotificationWindow(driver);
  await driver.clickElement({ text: 'Confirm' });
}

async function openConfirmedTransaction(driver: Driver) {
  await driver.switchToWindowWithTitle(WINDOW_TITLES.ExtensionInFullScreenView);
  await driver.clickElement('[data-testid="home__activity-tab"]');

  await driver.clickElement({
    css: '[data-testid="activity-list-item"]',
    text: 'Confirmed',
  });
}

async function expectTransactionDetail(
  driver: Driver,
  rowIndex: number,
  expectedText: string,
) {
  await driver.findElement({
    css: `[data-testid="transaction-breakdown-row"]:nth-child(${
      2 + rowIndex
    }) [data-testid="transaction-breakdown-row-value"]`,
    text: expectedText,
  });
}

async function expectTransactionDetailsMatchReceipt(
  driver: Driver,
  bundlerServer: Bundler,
) {
  const hexToDecimalString = (hex: string) => String(parseInt(hex, 16));

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

  await expectTransactionDetail(
    driver,
    TransactionDetailRowIndex.Nonce,
    hexToDecimalString(receipt.nonce),
  );

  await expectTransactionDetail(
    driver,
    TransactionDetailRowIndex.GasUsed,
    hexToDecimalString(receipt.actualGasUsed),
  );
}

async function withAccountSnap(
  { title, paymaster }: { title?: string; paymaster?: string },
  test: (driver: Driver, bundlerServer: Bundler) => Promise<void>,
) {
  await withFixtures(
    {
      fixtures: new FixtureBuilder()
        .withPermissionControllerConnectedToTestDapp()
        .build(),
      title,
      useBundler: true,
      usePaymaster: Boolean(paymaster),
      dapp: true,
      ganacheOptions: {
        hardfork: 'london',
      },
    },
    async ({
      driver,
      bundlerServer,
    }: {
      driver: Driver;
      bundlerServer: Bundler;
    }) => {
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

      await driver.closeWindow();
      await driver.switchToWindowWithTitle(
        WINDOW_TITLES.ExtensionInFullScreenView,
      );

      await test(driver, bundlerServer);
    },
  );
}

describe('User Operations', function () {
  it('from dApp transaction', async function (this: Mocha.Context) {
    await withAccountSnap({ title: this.test?.fullTitle() }, async (driver) => {
      await createDappTransaction(driver, {
        from: ERC_4337_ACCOUNT,
        to: GANACHE_ACCOUNT,
        value: convertETHToHexGwei(1),
        data: '0x',
      });

      await confirmTransaction(driver);
    });
  });

  it('from send transaction', async function (this: Mocha.Context) {
    if (process.env.MULTICHAIN) {
      return;
    }

    await withAccountSnap(
      { title: this.test?.fullTitle() },
      async (driver, bundlerServer) => {
        await sendTransaction(driver, GANACHE_ACCOUNT, 1, true);

        await openConfirmedTransaction(driver);
        await expectTransactionDetailsMatchReceipt(driver, bundlerServer);
      },
    );
  });

  it('from swap', async function (this: Mocha.Context) {
    await withAccountSnap(
      { title: this.test?.fullTitle() },
      async (driver, bundlerServer) => {
        await createSwap(driver);
        await openConfirmedTransaction(driver);
        await expectTransactionDetailsMatchReceipt(driver, bundlerServer);
      },
    );
  });

  it('with paymaster', async function (this: Mocha.Context) {
    await withAccountSnap(
      { title: this.test?.fullTitle(), paymaster: VERIFYING_PAYMASTER },
      async (driver, bundlerServer) => {
        await createDappTransaction(driver, {
          from: ERC_4337_ACCOUNT,
          to: GANACHE_ACCOUNT,
          value: convertETHToHexGwei(1),
          data: '0x',
        });

        await confirmTransaction(driver);
        await openConfirmedTransaction(driver);
        await expectTransactionDetailsMatchReceipt(driver, bundlerServer);
      },
    );
  });
});
