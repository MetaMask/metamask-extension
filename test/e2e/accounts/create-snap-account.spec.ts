import { promises } from 'fs';
const fs = promises;
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

async function tS (n: any, driver: any, title: any) {
  const artifactDir = `./test-artifacts/${driver.browser}/${title}`;
  const filepathBase = `${artifactDir}/test-failure`;
  const screenshot = await driver.takeScreenshot();
  await fs.writeFile(`${filepathBase}-${n}-screenshot.png`, screenshot, {
    encoding: 'base64',
  });

}

describe('Create Snap Account', function (this: Suite) {
  it('create Snap account popup contains correct Snap name and snapId', async function () {
    const driverOptions = { openDevToolsForTabs: true };

    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        ganacheOptions: defaultGanacheOptions,
        driverOptions,
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await unlockWallet(driver);
        const title1 = await driver.getTitle();

        await driver.switchToWindowWithTitle('MetaMask Offscreen Page');
        const offScreenWindowHandle = await driver.getWindowHandle();
        driver.addToIgnoredHandleList(offScreenWindowHandle);
        await driver.switchToWindowWithTitle('MetaMask');


        // navigate to test Snaps page and connect
        await driver.openNewPage(TEST_SNAPS_SIMPLE_KEYRING_WEBSITE_URL);
        // await tS(0, driver, this.test?.fullTitle());
        await driver.clickElement('#connectButton');

        // await tS(1, driver, this.test?.fullTitle());

        // switch to metamask extension and click connect to start installing the snap
        await switchToNotificationWindow(driver);

        // await tS(2, driver, this.test?.fullTitle());

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
        console.log('******************** 0')
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.SnapSimpleKeyringDapp,
        );
        await driver.waitForSelector({
          css: '#snapConnected',
          text: 'Connected',
        });
        console.log('******************** 1')
        await switchToNotificationWindow(driver);
        await driver.waitForSelector({ text: 'OK' });
        await driver.clickElement({
          text: 'OK',
          tag: 'button',
        });
        console.log('******************** 2')

        // await tS(3, driver, this.test?.fullTitle());

        // move back to the Snap window to test the create account flow
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.SnapSimpleKeyringDapp,
        );

        // await tS(4, driver, this.test?.fullTitle());


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
      },
    );
  });
});
