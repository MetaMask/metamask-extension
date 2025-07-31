/* eslint-disable */
// This file is a Playwright test, which differs significantly from our regular e2e tests.
// The structure of this test includes nested tests and multiple global tests, which violate our linting rules.

import { test } from '@playwright/test';
import FixtureBuilder from '../../../fixture-builder';
import { withPlaywrightFixtures } from '../../shared/fixtures/with-fixtures';
import packageJson from '../../../../../package.json';
import { loginWithBalanceValidation } from '../../shared/flows/login.flow';
import { HomePage } from '../../shared/pageObjects/home-page';
import { SettingsPage } from '../../shared/pageObjects/settings-page';
import { AboutPage } from '../../shared/pageObjects/about-page';
import { HeaderNavbar } from '../../shared/pageObjects/header-navbar';

test.describe('Setting - About MetaMask:', () => {
  test('Should display about MetaMask in Settings', async ({ }, testInfo) => {
    await withPlaywrightFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        title: testInfo.title,
        driverOptions: { timeOut: 15000 }
      },
      async ({ page }) => {
        // Login to MetaMask
        await loginWithBalanceValidation(page);

        // Initialize page objects
        const homePage = new HomePage(page);
        const headerNavbar = new HeaderNavbar(page);
        const settingsPage = new SettingsPage(page);
        const aboutPage = new AboutPage(page);

        // Navigate to Settings
        await headerNavbar.openSettingsPage();
        await settingsPage.checkPageIsLoaded();

        // Navigate to About section
        await settingsPage.goToAboutPage();

        // Verify About MetaMask page
        await aboutPage.checkPageIsLoaded();

        // Verify the MetaMask version number
        const { version } = packageJson;
        await aboutPage.checkMetaMaskVersionNumber(version);

        // Close settings page
        await settingsPage.closeSettingsPage();

        // Verify we're back on home page
        await homePage.checkPageIsLoaded();
      }
    );
  });
});