const { strict: assert } = require('assert');
const FixtureBuilder = require('../../fixture-builder');
const {
  defaultGanacheOptions,
  unlockWallet,
  withFixtures,
  regularDelayMs,
} = require('../../helpers');
const { shortenAddress } = require('../../../../ui/helpers/utils/util');
const { KNOWN_PUBLIC_KEY_ADDRESSES } = require('../../../stub/keyring-bridge');

/**
 * Connect Trezor hardware wallet without selecting an account
 *
 * @param {*} driver - Selenium driver
 */
async function connectTrezor(driver) {
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

describe('Trezor Hardware', function () {
  it('derives the correct accounts', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test.fullTitle(),
      },
      async ({ driver }) => {
        await unlockWallet(driver);
        await connectTrezor(driver);

        // Check that the first page of accounts is correct
        for (const { address, index } of KNOWN_PUBLIC_KEY_ADDRESSES.slice(
          0,
          4,
        )) {
          const shortenedAddress = `${address.slice(0, 4)}...${address.slice(
            -4,
          )}`;
          assert(
            await driver.isElementPresent({
              text: shortenedAddress,
            }),
            `Known account ${index} not found`,
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
        title: this.test.fullTitle(),
      },
      async ({ driver }) => {
        await unlockWallet(driver);
        await connectTrezor(driver);

        // Select first account of first page and unlock
        await driver.clickElement('.hw-account-list__item__checkbox');
        await driver.clickElement({ text: 'Unlock' });

        // Check that the correct account has been added
        await driver.clickElement('[data-testid="account-menu-icon"]');
        assert(
          await driver.isElementPresent({
            text: 'Trezor 1',
          }),
          'Trezor account not found',
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
});
