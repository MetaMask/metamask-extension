import { test as base, expect } from '@playwright/test';
import { ChromeExtensionPage } from '../../shared/pageObjects/extension-page';

export interface SimpleOnboardingFixtures {
  extensionPage: any;
}

export const test = base.extend<SimpleOnboardingFixtures>({
  extensionPage: async ({}, use) => {
    const chromeExtension = new ChromeExtensionPage();
    const page = await chromeExtension.initExtension();
    
    console.log('Extension loaded at:', page.url());
    
    await use(page);
    
    // Close the browser context
    await page.context().close();
  },
});

export { expect };