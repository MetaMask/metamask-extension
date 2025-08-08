import { test, expect } from '@playwright/test';
import { ChromeExtensionPage } from '../../shared/pageObjects/extension-page';
import { SignUpPage } from '../../shared/pageObjects/signup-page';
import { WalletPage } from '../../shared/pageObjects/wallet-page';

test.describe('MetaMask System Tests', () => {
  let page: any;
  let signUpPage: SignUpPage;
  let walletPage: WalletPage;

  test.beforeAll('Initialize MetaMask extension', async () => {
    const extension = new ChromeExtensionPage();
    page = await extension.initExtension();
    page.setDefaultTimeout(30000);
    
    signUpPage = new SignUpPage(page);
    walletPage = new WalletPage(page);
  });

  test('should complete onboarding and create new wallet', async () => {
    // Complete the onboarding process
    await signUpPage.createWallet();
    
    // Verify we're on the main wallet page
    await expect(page.locator('[data-testid="account-overview__asset-tab"]')).toBeVisible({ timeout: 30000 });
    
    // Take screenshot for verification
    await page.screenshot({ path: 'wallet-created.png' });
    
    console.log('✅ Wallet created successfully');
  });

  test('should display account overview', async () => {
    // Check that the main wallet interface is visible
    await expect(page.locator('[data-testid="account-overview__asset-tab"]')).toBeVisible();
    await expect(page.locator('[data-testid="eth-overview__primary-currency"]')).toBeVisible();
    
    // Check that we can see the account balance (should be 0 ETH)
    const balance = await page.locator('[data-testid="eth-overview__primary-currency"]').textContent();
    console.log('Account balance:', balance);
    
    expect(balance).toContain('ETH');
  });

  test('should be able to navigate to send transaction', async () => {
    // Click on the send button
    await page.locator('[data-testid="eth-overview-send"]').click();
    
    // Verify we're on the send page
    await expect(page.locator('[data-testid="ens-input"]')).toBeVisible({ timeout: 10000 });
    
    console.log('✅ Successfully navigated to send transaction page');
    
    // Go back to main page
    await page.goBack();
    await expect(page.locator('[data-testid="account-overview__asset-tab"]')).toBeVisible();
  });

  test('should be able to access account menu', async () => {
    // Click on account menu
    await page.locator('[data-testid="account-menu-icon"]').click();
    
    // Verify account menu is open
    await expect(page.locator('text=Account 1')).toBeVisible({ timeout: 10000 });
    
    console.log('✅ Account menu accessible');
    
    // Close the menu by clicking outside
    await page.locator('[data-testid="account-overview__asset-tab"]').click();
  });

  test('should display network selector', async () => {
    // Check that network selector is visible
    const networkSelector = page.locator('[data-testid="network-display"]');
    await expect(networkSelector).toBeVisible();
    
    // Get current network name
    const networkName = await networkSelector.textContent();
    console.log('Current network:', networkName);
    
    expect(networkName).toBeTruthy();
  });

  test.afterAll('Close browser', async () => {
    if (page) {
      await page.context().close();
    }
  });
});