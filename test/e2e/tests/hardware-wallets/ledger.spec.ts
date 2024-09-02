import { strict as assert } from 'assert';
import { sendTransaction } from '../../page-objects/flows/send-transaction.flow';
import FixtureBuilder from '../../fixture-builder';
import { Driver } from '../../webdriver/driver';
import HomePage from '../../page-objects/pages/homepage';
import {
  convertETHToHexGwei,
  defaultGanacheOptions,
  openDapp,
  regularDelayMs,
  unlockWallet,
  WINDOW_TITLES,
  withFixtures,
} from '../../helpers';
import {
  withFixturesOptions,
  buildQuote,
  reviewQuote,
  waitForTransactionToComplete,
  checkActivityTransaction,
} from '../swaps/shared';
import { shortenAddress } from '../../../../ui/helpers/utils/util';
import { KNOWN_PUBLIC_KEY_ADDRESSES } from '../../../stub/keyring-bridge';
import GanacheSeeder from '../../seeder/ganache-seeder';

/**
 * Connect Ledger hardware wallet without selecting an account
 *
 * @param {*} driver - Selenium driver
 */
async function connectLedger(driver: Driver) {
  // Open add hardware wallet modal
  await driver.clickElement('[data-testid="account-menu-icon"]');
  await driver.clickElement(
    '[data-testid="multichain-account-menu-popover-action-button"]',
  );
  await driver.clickElement({ text: 'Add hardware wallet' });
  // This delay is needed to mitigate an existing bug in FF
  // See https://github.com/metamask/metamask-extension/issues/25851
  await driver.delay(regularDelayMs);
  // Select Ledger
  await driver.clickElement('[data-testid="connect-ledger-btn"]');
  await driver.clickElement({ text: 'Continue' });
}

async function addLedgerAccount(driver: Driver) {
  // Select first account of first page and unlock
  await driver.clickElement('.hw-account-list__item__checkbox');
  await driver.clickElement({ text: 'Unlock' });
}

describe('Ledger Hardware', function () {
  it.only('derives the correct accounts', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await unlockWallet(driver);
        await connectLedger(driver);

        // Check that the first page of accounts is correct
        const accountElements = await driver.findElements('[data-testid="hw-account-list__item__address"]');
        assert.strictEqual(
          accountElements.length,
          5,
          `Expected 5 account elements, but found ${accountElements.length}`
        );

        for (const { address, index } of KNOWN_PUBLIC_KEY_ADDRESSES.slice(
          0,
          4,
        )) {
          const shortenedAddress = `${address.slice(0, 4)}...${address.slice(
            -4,
          )}`.toUpperCase();
          console.log(
            '==================================> shortenedAddress',
            shortenedAddress,
          );
          const displayedAddress = await accountElements[index].getText();
          console.log(
            '==================================> displayedAddress',
            displayedAddress,
          );
          assert.strictEqual(
            displayedAddress.toUpperCase(),
            shortenedAddress,
            `Known account ${index} with address ${shortenedAddress} not found`
          );
        }
      },
    );
  });

  it('unlocks the first account', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await unlockWallet(driver);
        await connectLedger(driver);

        await addLedgerAccount(driver);

        // Check that the correct account has been added
        await driver.clickElement('[data-testid="account-menu-icon"]');
        assert(
          await driver.isElementPresent({
            text: 'Ledger 1',
          }),
          'Ledger account not found',
        );
        assert(
          await driver.isElementPresent({
            text: shortenAddress(KNOWN_PUBLIC_KEY_ADDRESSES[0].address),
          }),
          'Unlocked account is wrong',
        );
      },
    );
  });

  it('unlocks the multiple accounts', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await unlockWallet(driver);
        await connectLedger(driver);

        // Select all account of first page and unlock
        await driver.clickElement('[id="address-0"]');
        await driver.clickElement('[id="address-1"]');
        await driver.clickElement('[id="address-2"]');
        await driver.clickElement('[id="address-3"]');
        await driver.clickElement('[id="address-4"]');
        await driver.clickElement({ text: 'Unlock' });
        await driver.delay(1000);

        // Check that the correct account has been added
        await driver.clickElement('[data-testid="account-menu-icon"]');
        assert(
          await driver.isElementPresent({
            text: 'Ledger 5',
          }),
          'Ledger account not found',
        );
        assert(
          await driver.isElementPresent({
            text: shortenAddress(KNOWN_PUBLIC_KEY_ADDRESSES[4].address),
          }),
          'Unlocked account is wrong',
        );
      },
    );
  });

  it('forgets the ledger account', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await unlockWallet(driver);
        await connectLedger(driver);

        // Select first account of first page and unlock
        await addLedgerAccount(driver);
        await driver.delay(regularDelayMs);
        await driver.clickElement('[data-testid="account-menu-icon"]');
        await driver.clickElement(
          '[data-testid="multichain-account-menu-popover-action-button"]',
        );
        await driver.clickElement({ text: 'Add hardware wallet' });
        await driver.delay(regularDelayMs);
        // Select Ledger
        await driver.clickElement('[data-testid="connect-ledger-btn"]');
        await driver.clickElement({ text: 'Continue' });
        // Forget device
        await driver.clickElement('[class="hw-forget-device-container"]');
        // Check that the correct account has been forgotten
        await driver.clickElement('[data-testid="account-menu-icon"]');
        assert(
          await driver.isElementPresent({
            text: 'Account 1',
          }),
          'Ledger account found',
        );
      },
    );
  });

  it.skip('can send a simple transaction from a ledger account to another', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test?.fullTitle(),
      },
      async ({ driver, ganacheServer }) => {
        await unlockWallet(driver);
        await connectLedger(driver);
        await addLedgerAccount(driver);
        const ganacheSeeder = new GanacheSeeder(ganacheServer?.getProvider());
        await ganacheSeeder.transfer(
          KNOWN_PUBLIC_KEY_ADDRESSES[0].address,
          convertETHToHexGwei(2),
        );
        await driver.delay(2000);
        const balance = await ganacheServer?.getAddressBalance(
          KNOWN_PUBLIC_KEY_ADDRESSES[0].address,
        );
        console.log('==============> balance', balance);
        await sendTransaction(
          driver,
          KNOWN_PUBLIC_KEY_ADDRESSES[1].address,
          '1',
          '0.000042',
          '1.000042',
        );
        const homePage = new HomePage(driver);
        await homePage.check_confirmedTxNumberDisplayedInActivity();
        await homePage.check_txAmountInActivity();
      },
    );
  });

  it.skip('can complete a swap transaction from a ledger account', async function () {
    await withFixtures(
      {
        ...withFixturesOptions,
        title: this.test?.fullTitle(),
      },
      async ({ driver, ganacheServer }) => {
        await unlockWallet(driver);
        await connectLedger(driver);
        await addLedgerAccount(driver);
        const ganacheSeeder = new GanacheSeeder(ganacheServer?.getProvider());
        await ganacheSeeder.transfer(
          KNOWN_PUBLIC_KEY_ADDRESSES[0].address,
          convertETHToHexGwei(2),
        );
        await buildQuote(driver, {
          amount: 1,
          swapTo: 'USDC',
          hardwareWallet: true,
        });
        await reviewQuote(driver, {
          amount: 1,
          swapFrom: 'TESTETH',
          swapTo: 'USDC',
        });
        await driver.clickElement({ text: 'Swap', tag: 'button' });
        await driver.clickElement({ text: 'View in activity', tag: 'button' });
        // FIX:- TX Failing, find a way to interact with Ledger bridge
        await waitForTransactionToComplete(driver, { tokenName: 'USDC' });
        await checkActivityTransaction(driver, {
          index: 0,
          amount: '1',
          swapFrom: 'TESTETH',
          swapTo: 'USDC',
        });
      },
    );
  });

  describe.skip('from test dapp', () => {
    it('send tx', async function () {
      await withFixtures(
        {
          dapp: true,
          fixtures: new FixtureBuilder()
            .withPermissionControllerConnectedToTestDapp(false)
            .build(),
          ganacheOptions: {
            ...defaultGanacheOptions,
            hardfork: 'london',
          },
          title: this.test?.fullTitle(),
        },
        async ({ driver, ganacheServer }) => {
          await unlockWallet(driver);
          await connectLedger(driver);
          await addLedgerAccount(driver);
          const ganacheSeeder = new GanacheSeeder(ganacheServer?.getProvider());
          await ganacheSeeder.transfer(
            KNOWN_PUBLIC_KEY_ADDRESSES[0].address,
            convertETHToHexGwei(2),
          );
          // initiates a transaction from the dapp
          await openDapp(driver);
          await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
          await driver.clickElement('#signTypedDataV4');
          // await driver.clickElement('#sendEIP1559Button');
          // const windowHandles = await driver.waitUntilXWindowHandles(3);
          await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

          // // const extension = windowHandles[0];
          // await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
          await driver.clickElement({ text: 'Confirm', tag: 'button' });
          // await driver.waitUntilXWindowHandles(2);
          await driver.delay(1000000);
          await driver.switchToWindow(WINDOW_TITLES.ExtensionInFullScreenView);

          // Identify the transaction in the transactions list
          await driver.waitForSelector(
            '[data-testid="eth-overview__primary-currency"]',
          );

          await driver.clickElement(
            '[data-testid="account-overview__activity-tab"]',
          );
          await driver.waitForSelector(
            '.transaction-list__completed-transactions .activity-list-item:nth-of-type(1)',
          );
          await driver.waitForSelector({
            css: '[data-testid="transaction-list-item-primary-currency"]',
            text: '-0 ETH',
          });
        },
      );
    });
  });
});
