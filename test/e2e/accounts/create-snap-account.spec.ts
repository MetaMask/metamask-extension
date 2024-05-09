const path = require('path');
const fs = require('fs');

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
  function runTest (n: any) {
    it(`${n}: create Snap account popup contains correct Snap name and snapId`, async function () {
      await withFixtures(
        {
          fixtures: new FixtureBuilder().build(),
          ganacheOptions: defaultGanacheOptions,
          title: this.test?.fullTitle(),
        },
        async ({ driver }: { driver: Driver }) => {
          try {
            await unlockWallet(driver);
            const title1 = await driver.getTitle();
            await driver.delay(1600)
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
            console.log('e',e)
           const logs = await driver.checkBrowserForLavamoatLogs();
           console.log('logs', logs)
           const artifactDir = `./test-artifacts/chrome/${this.test?.fullTitle()}`;
           const filepathBase = `${artifactDir}/test-failure`;
           // On occasion there may be a bug in the offscreen document which does
           // not render visibly to the user and therefore no screenshot can be
           // taken. In this case we skip the screenshot and log the error.
           try {
             await fs.promises.mkdir(artifactDir, { recursive: true });
             await fs.promises.writeFile(`${filepathBase}-${n}-error-logs.json`, JSON.stringify(logs));
           } catch (_e) {
             console.error('Failed to write logs', _e);
           }
            console.log(e)
            throw e;
          }
        },
      );
    });
  }

  runTest('1');
  runTest('2');
  runTest('3');
  runTest('4');
  runTest('5');
  runTest('6');
  runTest('7');
  runTest('8');
  runTest('9');
  runTest('10');
  runTest('11');
  runTest('12');
  runTest('13');
  runTest('14');
  runTest('15');
  runTest('16');
  runTest('17');
  runTest('18');
  runTest('19');
  runTest('20');
  runTest('21');
  runTest('22');
  runTest('23');
  runTest('24');
  runTest('25');
  runTest('26');
  runTest('27');
  runTest('28');
  runTest('29');
  runTest('30');
});
