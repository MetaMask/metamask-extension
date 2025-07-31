import { type Page, expect } from '@playwright/test';
import { SignUpPage } from '../pageObjects/signup-page';
import { HomePage } from '../pageObjects/home-page';

const ACCOUNT_PASSWORD = 'correct horse battery staple';

/**
 * Unlocks the wallet and navigates to the homepage.
 */
export const loginWithoutBalanceValidation = async (
  page: Page,
  password: string = ACCOUNT_PASSWORD,
) => {
  console.log(`Current URL: ${page.url()}`);

  const getStartedButton = page.locator('button:has-text("Get started")');
  const unlockButton = page.locator('button:has-text("Unlock")');

  try {
    // Check if wallet setup is needed
    await expect(getStartedButton).toBeVisible({ timeout: 5000 });
    console.log('Setting up wallet');
    const signUpPage = new SignUpPage(page);
    await signUpPage.importWallet();
  } catch {
    // Try to unlock existing wallet
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

  const homePage = new HomePage(page);
  await homePage.checkPageIsLoaded();
};

/**
 * Unlocks the wallet and validates the expected balance on the homepage.
 */
export const loginWithBalanceValidation = async (
  page: Page,
  password: string = ACCOUNT_PASSWORD,
  expectedBalance: string = '25',
) => {
  await loginWithoutBalanceValidation(page, password);
  const homePage = new HomePage(page);
  await homePage.checkExpectedBalanceIsDisplayed(expectedBalance);
};