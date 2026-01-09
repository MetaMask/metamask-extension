import type { Page } from '@playwright/test';
import { StartOnboardingPage } from './start-onboarding-page';
import { SrpPage } from './srp-page';
import { PasswordPage } from './password-page';
import { CompletePage } from './complete-page';

export type OnboardingOptions = {
  seedPhrase: string;
  password: string;
};

const DEFAULT_SEED_PHRASE =
  'spread raise short crane omit tent fringe mandate neglect detail suspect cradle';

const DEFAULT_PASSWORD = 'correct horse battery staple';

export class OnboardingFlow {
  private readonly startPage: StartOnboardingPage;
  private readonly srpPage: SrpPage;
  private readonly passwordPage: PasswordPage;
  private readonly completePage: CompletePage;

  constructor(private readonly page: Page) {
    this.startPage = new StartOnboardingPage(page);
    this.srpPage = new SrpPage(page);
    this.passwordPage = new PasswordPage(page);
    this.completePage = new CompletePage(page);
  }

  async importWallet(options: Partial<OnboardingOptions> = {}): Promise<void> {
    const seedPhrase = options.seedPhrase ?? DEFAULT_SEED_PHRASE;
    const password = options.password ?? DEFAULT_PASSWORD;

    console.log('Starting wallet import flow...');

    console.log('Step 1: Click Get Started');
    await this.startPage.clickGetStarted();

    console.log('Step 2: Select import wallet');
    await this.startPage.clickImportWallet();
    await this.startPage.clickImportWithSrp();

    console.log('Step 3: Enter seed phrase');
    await this.srpPage.fillSeedPhrase(seedPhrase);
    await this.srpPage.clickConfirm();

    console.log('Step 4: Create password');
    await this.passwordPage.createPassword(password);

    console.log('Step 5: Complete onboarding');
    await this.completePage.clickDone();

    console.log('Wallet import complete!');
  }

  async isOnboardingComplete(): Promise<boolean> {
    const accountMenuVisible = await this.page
      .locator('[data-testid="account-menu-icon"]')
      .isVisible({ timeout: 5000 })
      .catch(() => false);

    return accountMenuVisible;
  }
}

export { DEFAULT_SEED_PHRASE, DEFAULT_PASSWORD };
