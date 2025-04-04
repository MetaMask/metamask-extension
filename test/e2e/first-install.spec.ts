import assert from 'assert/strict';
import { Browser } from 'selenium-webdriver';
import { withFixtures } from './helpers';
import { errorMessages } from './webdriver/driver';
import StartOnboardingPage from './page-objects/pages/onboarding/start-onboarding-page';
import { hasProperty, isObject } from '@metamask/utils';

// Window handle adjustments will need to be made for Non-MV3 Firefox
// due to OffscreenDocument.
const IS_FIREFOX = process.env.SELENIUM_BROWSER === Browser.FIREFOX;

// The number of windows to expect to be open
const baseWindows =
  1 + // The primary window, starts out on extensions page
  (IS_FIREFOX ? 0 : 1); // The offscreen document, only on Chrome/MV3

describe('First install', function () {
  it('opens new window upon install, but not on subsequent reloads', async function () {
    await withFixtures(
      {
        disableServerMochaToBackground: true,
      },
      async ({ driver }) => {
        // Wait for MetaMask to automatically open a new tab
        await driver.waitUntilXWindowHandles(baseWindows + 1);

        // We cannot use customized driver functions related to window handles, as they depend upon
        // the background websocket connection enabled only for E2E test builds. This test runs on
        // a production-like build, which doesn't have this websocket connection.
        let windowHandles = await driver.driver.getAllWindowHandles();

        // Switch to new tab and verify it's the start onboarding page
        await driver.driver.switchTo().window(windowHandles[baseWindows]);
        const startOnboardingPage = new StartOnboardingPage(driver);
        await startOnboardingPage.check_pageIsLoaded();

        await driver.executeScript('window.stateHooks.reloadExtension()');

        // Wait for extension to reload, signified by the onboarding tab closing
        await driver.waitUntilXWindowHandles(baseWindows);

        // Test to see if it re-opens
        try {
          await driver.waitUntilXWindowHandles(baseWindows + 1);
        } catch (error) {
          if (
            isObject(error) &&
            hasProperty(error, 'message') &&
            typeof error.message === 'string' &&
            error.message.startsWith(
              errorMessages.waitUntilXWindowHandlesTimeout,
            )
          ) {
            // Ignore timeout error, it's expected here in the success case
            console.log('Onboarding tab not opened');
          } else {
            throw error;
          }
        }

        // Ensure new tab is not open
        windowHandles = await driver.driver.getAllWindowHandles();
        assert.equal(
          windowHandles.length,
          baseWindows,
          `Expected ${baseWindows} windows, found ${windowHandles.length}`,
        );
      },
    );
  });
});
