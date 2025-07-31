import { type Page, expect } from '@playwright/test';
import { SignUpPage } from '../pageObjects/signup-page';
import { HomePage } from '../pageObjects/home-page';

const ACCOUNT_PASSWORD = 'correct horse battery staple';

/**
 * This method unlocks the wallet and lands the user on the homepage.
 *
 * @param page - The Playwright page instance.
 * @param password - The password used to unlock the wallet.
 */
export const loginWithoutBalanceValidation = async (
  page: Page,
  password: string = ACCOUNT_PASSWORD,
) => {
  console.log('Navigate to unlock page and try to login with password');

  // Quick page state check
  console.log(`Current page URL: ${page.url()}`);
  console.log(`Page title: ${await page.title()}`);

  // Get page content briefly
  try {
    const bodyText = await page.textContent('body');
    console.log(`Page body text (first 200 chars): ${bodyText?.substring(0, 200)}...`);
  } catch (e) {
    console.log('Could not get body text:', e.message);
  }

  // Check if we need to import/create wallet first
  const getStartedButton = page.locator('button:has-text("Get started")');
  const unlockButton = page.locator('button:has-text("Unlock")');

  try {
    // If we see the Get Started button, we need to set up the wallet
    await expect(getStartedButton).toBeVisible({ timeout: 5000 });
    console.log('Found "Get started" button - setting up wallet');
    const signUpPage = new SignUpPage(page);
    await signUpPage.importWallet();
  } catch {
    // If no Get Started button, try to unlock with password
    try {
      await expect(unlockButton).toBeVisible({ timeout: 5000 });
      console.log('Found "Unlock" button - attempting to unlock');
      const passwordInput = page.locator('#password');
      await passwordInput.fill(password);
      await unlockButton.click();
    } catch {
      console.log('Already logged in or different state');
    }
  }

  // Verify we're on the homepage
  const homePage = new HomePage(page);
  await homePage.checkPageIsLoaded();
};

/**
 * This method unlocks the wallet and verifies that the user lands on the homepage with the expected balance.
 *
 * @param page - The Playwright page instance.
 * @param password - The password used to unlock the wallet.
 * @param expectedBalance - The balance value to be checked
 */
export const loginWithBalanceValidation = async (
  page: Page,
  password: string = ACCOUNT_PASSWORD,
  expectedBalance: string = '25',
) => {
  await loginWithoutBalanceValidation(page, password);
  const homePage = new HomePage(page);

  // Verify the expected balance on the homepage
  await homePage.checkExpectedBalanceIsDisplayed(expectedBalance);
};