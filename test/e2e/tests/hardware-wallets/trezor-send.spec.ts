import { Suite } from 'mocha';
import { Driver } from '../../webdriver/driver';
import { Ganache } from '../../seeder/ganache';
import FixtureBuilder from '../../fixture-builder';
import {
  defaultGanacheOptions,
  regularDelayMs,
  sendTransaction,
  unlockWallet,
  withFixtures,
} from '../../helpers';
import { KNOWN_PUBLIC_KEY_ADDRESSES } from '../../../stub/keyring-bridge';

/**
 * Connect Trezor hardware wallet without selecting an account
 *
 * @param driver - Selenium driver
 */
async function connectTrezor(driver: Driver) {
  // Open add hardware wallet modal
  await driver.clickElement('[data-testid="account-menu-icon"]');
  await driver.clickElement(
    '[data-testid="multichain-account-menu-popover-action-button"]',
  );
  await driver.clickElement({ text: 'Add hardware wallet' });
  // This delay is needed to mitigate an existing bug in FF
  // See https://github.com/metamask/metamask-extension/issues/25851
  await driver.delay(regularDelayMs);
  // Select Trezor
  await driver.clickElement('[data-testid="connect-trezor-btn"]');
  await driver.clickElement({ text: 'Continue' });
}

const RECIPIENT = '0x0Cc5261AB8cE458dc977078A3623E2BaDD27afD3';

describe('Trezor Hardware', function (this: Suite) {
  it('send ETH', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        ganacheOptions: {
          ...defaultGanacheOptions,
          hardfork: 'london',
        },
        title: this.test?.fullTitle(),
      },
      async ({
        driver,
        ganacheServer,
      }: {
        driver: Driver;
        ganacheServer?: Ganache;
      }) => {
        // Seed the Trezor account with balance
        await ganacheServer?.setAccountBalance(
          KNOWN_PUBLIC_KEY_ADDRESSES[0].address,
          '0x100000000000000000000',
        );
        await unlockWallet(driver);
        await connectTrezor(driver);

        // Select first account of first page and unlock
        await driver.clickElement('.hw-account-list__item__checkbox');
        await driver.clickElement({ text: 'Unlock' });

        await sendTransaction(driver, RECIPIENT, '1');

        // Wait for transaction to be confirmed
        await driver.waitForSelector({
          css: '.transaction-status-label',
          text: 'Confirmed',
        });
      },
    );
  });
});
