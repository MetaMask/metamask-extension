/* eslint-disable */
// This file is a Playwright test, which differs significantly from our regular e2e tests.
// The structure of this test includes nested tests and multiple global tests, which violate our linting rules.

import { test, expect } from '@playwright/test';
import { ChromeExtensionPage } from '../../shared/pageObjects/extension-page';
import { AboutPage } from '../../shared/pageObjects/about-page';
import { SettingsPage } from '../../shared/pageObjects/settings-page';
import { HomePage } from '../../shared/pageObjects/home-page';
import { HeaderNavbar } from '../../shared/pageObjects/header-navbar';
import { SignUpPage } from '../../shared/pageObjects/signup-page';
import packageJson from '../../../../../package.json';

let aboutPage: AboutPage;
let settingsPage: SettingsPage;
let homePage: HomePage;
let headerNavbar: HeaderNavbar;

test.beforeAll(
  'Initialize extension and setup wallet',
  async () => {
    const extension = new ChromeExtensionPage();
    const page = await extension.initExtension();
    page.setDefaultTimeout(15000);

    const signUp = new SignUpPage(page);
    await signUp.createWallet();

    // Initialize page objects
    aboutPage = new AboutPage(page);
    settingsPage = new SettingsPage(page);
    homePage = new HomePage(page);
    headerNavbar = new HeaderNavbar(page);
  },
);

// Test case to validate the view in the "About" - MetaMask.
test.describe('Setting - About MetaMask', () => {
  test('validate the view', async () => {
    // Verify we're on homepage first
    await homePage.checkPageIsLoaded();

    // Navigate to settings and click on about page
    await headerNavbar.openSettingsPage();
    await settingsPage.checkPageIsLoaded();
    await settingsPage.goToAboutPage();

    // Verify About page loads and check version
    await aboutPage.checkPageIsLoaded();
    const { version } = packageJson;
    await aboutPage.checkMetaMaskVersionNumber(version);

    // Close settings and return to homepage
    await settingsPage.closeSettingsPage();
    await homePage.checkPageIsLoaded();
  });
});