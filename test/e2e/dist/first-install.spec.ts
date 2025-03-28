import assert from 'assert/strict';
import { Browser } from 'selenium-webdriver';
import { withFixtures } from '../helpers';
import { errorMessages } from '../webdriver/driver';
import StartOnboardingPage from '../page-objects/pages/onboarding/start-onboarding-page';
import { hasProperty, isObject } from '@metamask/utils';

describe('First install', function () {
  it('opens new window upon install, but not on subsequent reloads', async function () {
    await withFixtures(
      {
        disableServerMochaToBackground: true,
      },
      async ({ driver }) => {
        // Wait for MetaMask to automatically open a new tab
        await driver.waitUntilXWindowHandles(2);

        let windowHandles = await driver.getAllWindowHandles();

        // Switch to new tab and verify it's the start onboarding page
        await driver.driver.switchTo().window(windowHandles[1]);
        const startOnboardingPage = new StartOnboardingPage(driver);
        await startOnboardingPage.check_pageIsLoaded();

        await driver.executeScript('window.stateHooks.reloadExtension()');

        // Wait for extension to reload, signified by the onboarding tab closing
        await driver.waitUntilXWindowHandles(1);

        // Test to see if it re-opens
        try {
          await driver.waitUntilXWindowHandles(2);
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
            return;
          } else {
            throw error;
          }
        }
        throw new Error('Onboarding tab opened unexpectedly');
      },
    );
  });
});
