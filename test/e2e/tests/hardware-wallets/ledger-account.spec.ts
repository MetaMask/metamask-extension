import { strict as assert } from 'assert';
import FixtureBuilder from '../../fixture-builder';
import { Driver } from '../../webdriver/driver';
import {
  defaultGanacheOptions,
  regularDelayMs,
  unlockWallet,
  withFixtures,
} from '../../helpers';
import { shortenAddress } from '../../../../ui/helpers/utils/util';
import { KNOWN_PUBLIC_KEY_ADDRESSES } from '../../../stub/keyring-bridge';
import { DEFAULT_FIXTURE_ACCOUNT } from '../../constants';

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
  it('derives the correct accounts', async function () {
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
        const accountElements = await driver.findElements(
          '[data-testid="hw-account-list__item__address"]',
        );
        assert.strictEqual(
          accountElements.length,
          5,
          `Expected 5 account elements, but found ${accountElements.length}`,
        );

        for (const { address, index } of KNOWN_PUBLIC_KEY_ADDRESSES.slice(
          0,
          4,
        )) {
          const shortenedAddress = `${address.slice(0, 4)}...${address.slice(
            -4,
          )}`.toUpperCase();
          const displayedAddress = await accountElements[index].getText();
          assert.strictEqual(
            displayedAddress.toUpperCase(),
            shortenedAddress,
            `Known account ${index} with address ${shortenedAddress} not found`,
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

        await driver.clickElement('[data-testid="account-menu-icon"]');
        assert(
          await driver.isElementPresent({
            text: 'Ledger 1',
          }),
          'Ledger account not found',
        );
        const accountElements = await driver.findElements(
          '[data-testid="account-list-address"]',
        );
        const displayedAddress = await accountElements[1].getText();
        const shortenedAddress = shortenAddress(
          KNOWN_PUBLIC_KEY_ADDRESSES[0].address,
        ).toUpperCase();

        // Check that the correct account has been added
        assert.strictEqual(
          displayedAddress.toUpperCase(),
          shortenedAddress,
          `Unlocked account is wrong`,
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

        await driver.clickElement('[data-testid="account-menu-icon"]');
        const accountElements = await driver.findElements(
          '[data-testid="account-list-address"]',
        );
        const ADDRESSES = [
          DEFAULT_FIXTURE_ACCOUNT,
          ...KNOWN_PUBLIC_KEY_ADDRESSES.map(
            (addressObject) => addressObject.address,
          ),
        ];

        // Check that the corrects accounts have been added
        for (let i = 0; i < accountElements.length; i++) {
          const displayedAddress = await accountElements[i].getText();
          const shortenedAddress = shortenAddress(ADDRESSES[i]).toUpperCase();
          assert.strictEqual(
            displayedAddress.toUpperCase(),
            shortenedAddress,
            `Unlocked account is wrong`,
          );
        }
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
        await addLedgerAccount(driver);
        await driver.clickElement('[data-testid="account-menu-icon"]');
        // Check if ledger account is listed
        assert(
          await driver.isElementPresent({
            text: 'Ledger 1',
          }),
          'Ledger account not found',
        );
        await driver.clickElement(
          '[data-testid="multichain-account-menu-popover-action-button"]',
        );
        await driver.clickElement({ text: 'Add hardware wallet' });
        // Select Ledger
        await driver.clickElement('[data-testid="connect-ledger-btn"]');
        await driver.clickElement({ text: 'Continue' });
        // Forget device
        await driver.clickElement('[class="hw-forget-device-container"]');
        // Check if ledger account is not listed anymore
        await driver.clickElement('[data-testid="account-menu-icon"]');
        await driver.assertElementNotPresent(
          {
            text: 'Ledger 1',
          },
          {
            waitAtLeastGuard: 200,
          },
        );
      },
    );
  });
});
