import { test as base, expect } from '@playwright/test';
import path from 'path';
import { chromium, BrowserContext, Page } from '@playwright/test';

const extensionPath = path.join(__dirname, '../../../../../dist/chrome');

export interface OnboardingFixtures {
  context: BrowserContext;
  extensionPage: Page;
  onboardingHelper: OnboardingHelper;
}

class OnboardingHelper {
  constructor(private page: Page) {}

    async waitForOnboardingStart() {
    // The extension should already be on the terms page
    // Just wait for the page to be ready
    await this.page.waitForLoadState('networkidle', { timeout: 30000 });
    console.log('Current page URL:', this.page.url());
  }

  async acceptTermsAndConditions() {
    // First check if we need to accept terms
    try {
      await this.page.waitForSelector('[data-testid="onboarding-terms-checkbox"]', { timeout: 5000 });
      await this.page.click('[data-testid="onboarding-terms-checkbox"]');
    } catch (error) {
      // Terms might already be accepted or not present
    }

    // Look for various possible buttons to create wallet
    const createButtons = [
      'button:has-text("Create a new wallet")',
      'button:has-text("Create wallet")',
      'button:has-text("Get started")',
      '[data-testid="onboarding-create-wallet"]'
    ];

    for (const buttonSelector of createButtons) {
      try {
        await this.page.waitForSelector(buttonSelector, { timeout: 3000 });
        await this.page.click(buttonSelector);
        break;
      } catch (error) {
        // Try next button selector
        continue;
      }
    }
  }

  async createPassword(password: string = 'Test1234!') {
    await this.page.fill('[data-testid="create-password-new"]', password);
    await this.page.fill('[data-testid="create-password-confirm"]', password);
    await this.page.click('[data-testid="create-password-terms"]');
    await this.page.click('button:has-text("Create password")');
  }

  async skipSecureWallet() {
    await this.page.click('button:has-text("Remind me later")');
    await this.page.click('button:has-text("Skip")');
  }

  async completeSecureWallet() {
    // Click to reveal seed phrase
    await this.page.click('[data-testid="recovery-phrase-reveal"]');

    // Get the seed phrase words
    const seedPhraseElements = await this.page.locator('[data-testid="recovery-phrase-chip"]').all();
    const seedPhrase: string[] = [];

    for (const element of seedPhraseElements) {
      const word = await element.textContent();
      if (word) seedPhrase.push(word.trim());
    }

    await this.page.click('button:has-text("Next")');

    // Confirm seed phrase by clicking words in order
    for (let i = 0; i < seedPhrase.length; i++) {
      await this.page.click(`[data-testid="recovery-phrase-input-${i}"]`);
      await this.page.fill(`[data-testid="recovery-phrase-input-${i}"]`, seedPhrase[i]);
    }

    await this.page.click('button:has-text("Confirm")');
  }

  async completeOnboarding() {
    await this.page.click('button:has-text("Got it!")');
    await this.page.click('button:has-text("Next")');
    await this.page.click('button:has-text("Done")');
  }

  async importWallet(seedPhrase: string, password: string = 'Test1234!') {
    await this.page.click('button:has-text("Import an existing wallet")');
    await this.page.click('button:has-text("I agree")');

    // Enter seed phrase
    const seedWords = seedPhrase.split(' ');
    for (let i = 0; i < seedWords.length; i++) {
      await this.page.fill(`[data-testid="import-srp__srp-word-${i}"]`, seedWords[i]);
    }

    await this.page.click('button:has-text("Confirm Secret Recovery Phrase")');

    // Set password
    await this.page.fill('[data-testid="create-password-new"]', password);
    await this.page.fill('[data-testid="create-password-confirm"]', password);
    await this.page.click('[data-testid="create-password-terms"]');
    await this.page.click('button:has-text("Import my wallet")');

    await this.completeOnboarding();
  }

  async waitForHomePage() {
    await this.page.waitForSelector('[data-testid="account-overview__asset-tab"]', { timeout: 30000 });
  }
}

export const test = base.extend<OnboardingFixtures>({
  context: async ({}, use) => {
    const launchOptions = {
      headless: process.env.HEADLESS === 'true',
      args: [
        `--disable-extensions-except=${extensionPath}`,
        `--load-extension=${extensionPath}`,
      ],
    };

    const context = await chromium.launchPersistentContext('', launchOptions);
    await use(context);
    await context.close();
  },

  extensionPage: async ({ context }, use) => {
    // Create a new page and wait for extension to load
    await context.newPage();
    await context.waitForEvent('page');
    
    const pages = context.pages();
    console.log(`Found ${pages.length} pages`);
    
    // Find extension page or use the last page
    let extensionPage = pages.find(page => {
      const url = page.url();
      return url.includes('chrome-extension://') || url.includes('moz-extension://');
    });
    
    if (!extensionPage) {
      // Use the last opened page as fallback
      extensionPage = pages[pages.length - 1];
    }
    
    console.log('Extension page URL:', extensionPage.url());
    await extensionPage.bringToFront();
    
    // Wait for MetaMask to be ready
    try {
      await extensionPage.waitForSelector('text=/I agree to MetaMask/', { timeout: 30000 });
    } catch (error) {
      // Extension might already be set up, continue anyway
      console.log('MetaMask terms not found, extension might be already set up');
    }
    
    await use(extensionPage);
  },

  onboardingHelper: async ({ extensionPage }, use) => {
    const helper = new OnboardingHelper(extensionPage);
    await use(helper);
  },
});

export { expect };
