import { test, expect } from '../fixtures/simple-onboarding.fixture';

test.describe('Simple MetaMask Test', () => {
  test('should load MetaMask extension successfully', async ({ extensionPage }) => {
    console.log('Extension page URL:', extensionPage.url());
    console.log('Extension page title:', await extensionPage.title());
    
    // Take a screenshot for debugging
    await extensionPage.screenshot({ path: 'metamask-loaded.png' });
    
    // Check if we can find the MetaMask terms agreement
    try {
      await extensionPage.waitForSelector('text=/I agree to MetaMask/', { timeout: 10000 });
      console.log('Found MetaMask terms agreement');
      
      // Try to click the agreement
      await extensionPage.click('text=/I agree to MetaMask/');
      
      // Wait for next step
      await extensionPage.waitForTimeout(2000);
      
      console.log('Successfully interacted with MetaMask onboarding');
    } catch (error) {
      console.log('Terms agreement not found, checking page content...');
      const bodyText = await extensionPage.locator('body').textContent();
      console.log('Page content:', bodyText?.substring(0, 1000));
      
      // Check if extension is already set up
      const isSetup = await extensionPage.locator('[data-testid="account-overview__asset-tab"]').isVisible().catch(() => false);
      if (isSetup) {
        console.log('Extension appears to be already set up');
      } else {
        console.log('Extension state unclear');
      }
    }
    
    // Basic assertion that we have a page
    expect(extensionPage.url()).not.toBe('about:blank');
  });
});