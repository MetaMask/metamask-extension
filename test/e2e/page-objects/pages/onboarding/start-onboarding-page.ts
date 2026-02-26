import { AuthConnection } from '@metamask/seedless-onboarding-controller';
import { Driver } from '../../../webdriver/driver';

class StartOnboardingPage {
  private driver: Driver;

  private readonly createWalletButton =
    '[data-testid="onboarding-create-wallet"]';

  private readonly importWalletButton =
    '[data-testid="onboarding-import-wallet"]';

  private readonly onboardingCreateWithSrpButton =
    '[data-testid="onboarding-create-with-srp-button"]';

  private readonly onboardingImportWithSrpButton =
    '[data-testid="onboarding-import-with-srp-button"]';

  private readonly onboardingCreateWithGoogleButton =
    '[data-testid="onboarding-create-with-google-button"]';

  private readonly onboardingImportWithGoogleButton =
    '[data-testid="onboarding-import-with-google-button"]';

  private readonly onboardingCreateWithAppleButton =
    '[data-testid="onboarding-create-with-apple-button"]';

  private readonly onboardingImportWithAppleButton =
    '[data-testid="onboarding-import-with-apple-button"]';

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async checkLoginPageIsLoaded(): Promise<void> {
    try {
      await this.driver.waitForMultipleSelectors(
        [this.createWalletButton, this.importWalletButton],
        { timeout: 20000 },
      );
    } catch (e) {
      console.log('Timeout while waiting for get started page to be loaded', e);
      throw e;
    }
    console.log('Get started page is loaded');
  }

  async createWalletWithSrp(socialLoginEnabled = true): Promise<void> {
    await this.driver.clickElement(this.createWalletButton);
    if (socialLoginEnabled) {
      await this.clickCreateWithSrpButton();
    }
  }

  async clickCreateWithSrpButton(): Promise<void> {
    await this.driver.clickElement(this.onboardingCreateWithSrpButton);
  }

  async clickImportWithSrpButton(): Promise<void> {
    await this.driver.clickElement(this.onboardingImportWithSrpButton);
  }

  async checkUserSrpButtonIsVisible(): Promise<void> {
    await this.driver.waitForSelector(this.onboardingImportWithSrpButton);
  }

  async importWallet(withSrpButton = true): Promise<void> {
    await this.driver.clickElement(this.importWalletButton);
    if (withSrpButton) {
      await this.driver.clickElement(this.onboardingImportWithSrpButton);
    }
  }

  async createWalletWithSocialLogin(
    authConnection = AuthConnection.Google,
  ): Promise<void> {
    await this.driver.clickElement(this.createWalletButton);

    const socialLoginButton =
      authConnection === AuthConnection.Google
        ? this.onboardingCreateWithGoogleButton
        : this.onboardingCreateWithAppleButton;

    await this.driver.waitForSelector(socialLoginButton);
    await this.driver.clickElement(socialLoginButton);
  }

  async importWalletWithSocialLogin(
    authConnection = AuthConnection.Google,
  ): Promise<void> {
    await this.driver.clickElement(this.importWalletButton);

    const socialLoginButton =
      authConnection === AuthConnection.Google
        ? this.onboardingImportWithGoogleButton
        : this.onboardingImportWithAppleButton;

    await this.driver.waitForSelector(socialLoginButton);
    await this.driver.clickElement(socialLoginButton);
  }

  async checkSocialSignUpFormIsVisible(): Promise<void> {
    try {
      await this.driver.waitForSelector(this.onboardingCreateWithGoogleButton);
    } catch (e) {
      console.log(
        'Timeout while waiting for social sign up form to be loaded',
        e,
      );
      throw e;
    }
    console.log('Social sign up form is loaded');
  }
}

export default StartOnboardingPage;
