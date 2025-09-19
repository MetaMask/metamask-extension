import {
  withFixtures,
  unlockWallet,
  switchToNotificationWindow,
  WINDOW_TITLES,
  sendTransaction,
  convertETHToHexGwei,
  createDappTransaction,
} from '../helpers';
import FixtureBuilder from '../fixture-builder';
import {
  BUNDLER_URL,
  ENTRYPOINT,
  ERC_4337_ACCOUNT,
  ERC_4337_ACCOUNT_SALT,
  ERC_4337_ACCOUNT_SNAP_URL,
  LOCAL_NODE_ACCOUNT,
  LOCAL_NODE_PRIVATE_KEY,
  SIMPLE_ACCOUNT_FACTORY,
  VERIFYING_PAYMASTER,
} from '../constants';
import { Driver } from '../webdriver/driver';
import { Bundler } from '../bundler';
import { SWAP_TEST_ETH_USDC_TRADES_MOCK } from '../../data/mock-data';
import { Mockttp } from '../mock-e2e';
import TestDapp from '../page-objects/pages/test-dapp';
import { mockAccountAbstractionKeyringSnap } from '../mock-response-data/snaps/snap-binary-mocks';

enum TransactionDetailRowIndex {
  Nonce = 0,
  GasUsed = 3,
}

async function installExampleSnap(driver: Driver) {
  await driver.openNewPage(ERC_4337_ACCOUNT_SNAP_URL);
  await driver.clickElement('#connectButton');
  await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
  await driver.clickElement({
    text: 'Connect',
    tag: 'button',
  });
  await driver.findElement({ text: 'Add to MetaMask', tag: 'h3' });
  await driver.clickElementSafe('[data-testid="snap-install-scroll"]', 200);
  await driver.waitForSelector({ text: 'Confirm' });
  await driver.clickElement({
    text: 'Confirm',
    tag: 'button',
  });
  await driver.waitForSelector({ text: 'OK' });
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
  await driver.clickElement({ text: 'Add account', tag: 'button' });
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
    paymasterSK,
  }: {
    bundlerUrl: string;
    entrypoint: string;
    simpleAccountFactory: string;
    paymaster?: string;
    paymasterSK?: string;
  },
) {
  await driver.switchToWindowWithTitle('Account Abstraction Snap');
  await driver.clickElement('[data-testid="chain-select"]');
  await driver.clickElement('[data-testid="chain-id-1337"]');
  await driver.fill('[data-testid="bundlerUrl"]', bundlerUrl);
  await driver.fill('[data-testid="entryPoint"]', entrypoint);
  await driver.fill(
    '[data-testid="simpleAccountFactory"]',
    simpleAccountFactory,
  );
  if (paymaster) {
    await driver.fill(
      '[data-testid="customVerifyingPaymasterAddress"]',
      paymaster,
    );
  }
  if (paymasterSK) {
    await driver.fill(
      '[data-testid="customVerifyingPaymasterSK"]',
      paymasterSK,
    );
  }

  await driver.clickElement({ text: 'Set Chain Config', tag: 'button' });
}

async function confirmTransaction(driver: Driver) {
  await switchToNotificationWindow(driver);
  await driver.clickElement({ text: 'Confirm' });
}

async function openConfirmedTransaction(driver: Driver) {
  await driver.switchToWindowWithTitle(WINDOW_TITLES.ExtensionInFullScreenView);
  await driver.clickElement('[data-testid="account-overview__activity-tab"]');

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

  const receipt =
    await bundlerServer.getUserOperationReceipt(userOperationHash);

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

async function mockSwapsTransactionQuote(mockServer: Mockttp) {
  return [
    await mockServer
      .forGet('https://bridge.api.cx.metamask.io/networks/1/trades')
      .thenCallback(() => ({
        statusCode: 200,
        json: SWAP_TEST_ETH_USDC_TRADES_MOCK,
      })),
  ];
}
async function mockSnapAndSwaps(mockServer: Mockttp) {
  return [
    await mockSwapsTransactionQuote(mockServer),
    await mockAccountAbstractionKeyringSnap(mockServer),
  ];
}

async function withAccountSnap(
  {
    title,
    paymaster,
    localNodeOptions,
  }: { title?: string; paymaster?: string; localNodeOptions?: object },
  testCallback: (driver: Driver, bundlerServer: Bundler) => Promise<void>,
) {
  await withFixtures(
    {
      fixtures: new FixtureBuilder().build(),
      title,
      useBundler: true,
      usePaymaster: Boolean(paymaster),
      dapp: true,
      localNodeOptions: localNodeOptions || {
        hardfork: 'london',
        mnemonic:
          'phrase upgrade clock rough situate wedding elder clever doctor stamp excess tent',
      },
      testSpecificMock: mockSnapAndSwaps,
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
        LOCAL_NODE_PRIVATE_KEY,
        ERC_4337_ACCOUNT_SALT,
      );

      const testDapp = new TestDapp(driver);
      await testDapp.openTestDappPage();
      await testDapp.connectAccount({ publicAddress: ERC_4337_ACCOUNT });

      await driver.switchToWindowWithTitle(
        WINDOW_TITLES.ExtensionInFullScreenView,
      );

      await testCallback(driver, bundlerServer);
    },
  );
}

describe('User Operations', function () {
  it('from dApp transaction', async function () {
    await withAccountSnap({ title: this.test?.fullTitle() }, async (driver) => {
      await createDappTransaction(driver, {
        from: ERC_4337_ACCOUNT,
        to: LOCAL_NODE_ACCOUNT,
        value: convertETHToHexGwei(1),
        maxFeePerGas: '0x0',
        maxPriorityFeePerGas: '0x0',
      });

      await confirmTransaction(driver);
    });
  });

  it('from send transaction', async function () {
    await withAccountSnap(
      { title: this.test?.fullTitle() },
      async (driver, bundlerServer) => {
        await sendTransaction(driver, LOCAL_NODE_ACCOUNT, 1, true);

        await openConfirmedTransaction(driver);
        await expectTransactionDetailsMatchReceipt(driver, bundlerServer);
      },
    );
  });

  // it.skip('from swap', async function () {
  //   await withAccountSnap(
  //     { title: this.test?.fullTitle() },
  //     async (driver, bundlerServer) => {
  //       await createSwap(driver);
  //       await openConfirmedTransaction(driver);
  //       await expectTransactionDetailsMatchReceipt(driver, bundlerServer);
  //     },
  //   );
  // });

  it('with paymaster', async function () {
    await withAccountSnap(
      {
        title: this.test?.fullTitle(),
        paymaster: VERIFYING_PAYMASTER,
        localNodeOptions: [
          {
            type: 'ganache',
            options: {
              hardfork: 'london',
              mnemonic:
                'phrase upgrade clock rough situate wedding elder clever doctor stamp excess tent',
            },
          },
        ],
      },
      async (driver, bundlerServer) => {
        await createDappTransaction(driver, {
          from: ERC_4337_ACCOUNT,
          to: LOCAL_NODE_ACCOUNT,
          value: convertETHToHexGwei(1),
          maxFeePerGas: '0x0',
          maxPriorityFeePerGas: '0x0',
        });

        await confirmTransaction(driver);
        await openConfirmedTransaction(driver);
        await expectTransactionDetailsMatchReceipt(driver, bundlerServer);
      },
    );
  });
});
