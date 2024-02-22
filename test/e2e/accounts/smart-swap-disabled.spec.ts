import { title } from 'process';
import { Suite } from 'mocha';
import { withFixtures } from '../helpers';
import { Driver } from '../webdriver/driver';
import {
  accountSnapFixtures,
  installSnapSimpleKeyring,
  makeNewAccountAndSwitch,
} from './common';

describe('Smart Swaps', function (this: Suite) {
  it('should be disabled for snap accounts', async function () {
    await withFixtures(
      accountSnapFixtures(title),
      async ({ driver }: { driver: Driver }) => {
        await installSnapSimpleKeyring(driver, false);
        await makeNewAccountAndSwitch(driver);
        await driver.clickElement('[data-testid="token-overview-button-swap"]');
        await driver.clickElement('[title="Transaction settings"]');

        // Guard before waitForElementNotPresent -- wait for the modal to appear
        await driver.findElement({ tag: 'h6', text: 'Slippage tolerance' });

        await driver.waitForElementNotPresent(
          '[data-testid="transaction-settings-smart-swaps-toggle"]',
        );
      },
    );
  });
});
