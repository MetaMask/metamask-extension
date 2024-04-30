import { Suite } from 'mocha';
import FixtureBuilder from '../fixture-builder';
import {
  WINDOW_TITLES,
  defaultGanacheOptions,
  switchToNotificationWindow,
  unlockWallet,
  withFixtures,
} from '../helpers';
import { Driver } from '../webdriver/driver';
import { TEST_SNAPS_SIMPLE_KEYRING_WEBSITE_URL } from '../constants';

describe('Create Snap Account', function (this: Suite) {
  it('create Snap account popup contains correct Snap name and snapId', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        try {
          await unlockWallet(driver);

          // navigate to test Snaps page and connect
          await driver.openNewPage(TEST_SNAPS_SIMPLE_KEYRING_WEBSITE_URL);
          await driver.clickElement('#connectButton');

          // switch to metamask extension and click connect to start installing the snap
          await switchToNotificationWindow(driver);

          await driver.clickElement({
            text: 'Connect',
            tag: 'button',
          });

          // scroll to the bottom of the page
          await driver.waitForSelector({ text: 'Confirm' });
          await driver.clickElementSafe('[data-testid="snap-install-scroll"]');

          // click the install button to install the snap
          await driver.waitForSelector({ text: 'Confirm' });
          await driver.clickElement({
            text: 'Confirm',
            tag: 'button',
          });
          await driver.switchToWindowWithTitle(
            WINDOW_TITLES.SnapSimpleKeyringDapp,
          );
          await driver.waitForSelector({
            css: '#snapConnected',
            text: 'Connected',
          });
          await switchToNotificationWindow(driver);
          await driver.waitForSelector({ text: 'OK' });
          await driver.clickElement({
            text: 'OK',
            tag: 'button',
          });

          // move back to the Snap window to test the create account flow
          await driver.switchToWindowWithTitle(
            WINDOW_TITLES.SnapSimpleKeyringDapp,
          );


          // check the dapp connection status
          await driver.waitForSelector({
            css: '#snapConnected',
            text: 'Connected',
          });

          // create new account on dapp
          await driver.clickElement({
            text: 'Create account',
            tag: 'div',
          });

          await driver.clickElement({
            text: 'Create Account',
            tag: 'button',
          });

          await switchToNotificationWindow(driver);

          await driver.findElement({
            css: '[data-testid="confirmation-submit-button"]',
            text: 'Create',
          });

          await driver.findElement({
            css: '[data-testid="confirmation-cancel-button"]',
            text: 'Cancel',
          });

          await driver.findElement({
            css: '[data-testid="create-snap-account-content-title"]',
            text: 'Create account',
          });
          console.log('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!')
        } catch (e) {
          console.log('@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@')
          console.log(e)
          throw e;
        }
      },
    );
  });
});
