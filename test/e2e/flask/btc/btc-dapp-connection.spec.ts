import { strict as assert } from 'assert';
import { Suite } from 'mocha';
import { openDapp, WINDOW_TITLES } from '../../helpers';
import { withBtcAccountSnap } from './common-btc';

describe('BTC Account - Dapp Connection', function (this: Suite) {
  it('cannot connect to dapps', async function () {
    await withBtcAccountSnap(
      { title: this.test?.fullTitle() },
      async (driver) => {
        await openDapp(driver);
        await driver.clickElement('#connectButton');
        await driver.waitUntilXWindowHandles(3);
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        const account2 = await driver.waitForSelector(
          '[data-testid="choose-account-list-1"]',
        );
        assert((await account2.getText()).includes('Bitcoin Ac...'));
        await account2.click();
        const nextButton = await driver.waitForSelector(
          '[data-testid="page-container-footer-next"]',
        );
        assert.equal(await nextButton.isEnabled(), false);
      },
    );
  });
});
