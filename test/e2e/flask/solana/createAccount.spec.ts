import { Suite } from 'mocha';

import messages from '../../../../app/_locales/en/messages.json';
import FixtureBuilder from '../../fixture-builder';
import {
  defaultGanacheOptions,
  unlockWallet,
  withFixtures,
} from '../../helpers';
import { Driver } from '../../webdriver/driver';

describe('BTC Experimental Settings', function (this: Suite) {
  it('will show `Add a new Solana account (Beta)` option when setting is enabled', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await unlockWallet(driver);
        await driver.clickElement(
          '[data-testid="account-options-menu-button"]',
        );
        await driver.clickElement({ text: 'Settings', tag: 'div' });
        await driver.clickElement({ text: 'Experimental', tag: 'div' });

        await driver.waitForSelector({
          text: messages.bitcoinSupportToggleTitle.message,
          tag: 'span',
        });

        await driver.clickElement('[data-testid="solana-support-toggle-div"]');

        await driver.clickElement('button[aria-label="Close"]');

        await driver.clickElement('[data-testid="account-menu-icon"]');
        await driver.clickElement(
          '[data-testid="multichain-account-menu-popover-action-button"]',
        );
        await driver.waitForSelector({
          text: messages.addNewSolanaAccount.message,
          tag: 'button',
        });
      },
    );
  });
});
