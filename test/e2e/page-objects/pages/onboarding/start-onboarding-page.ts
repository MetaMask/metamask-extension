import { strict as assert } from 'assert';
import { AuthConnection } from '../../../../../shared/constants/onboarding';
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

  private readonly onboardingCreateWithTelegramButton =
    '[data-testid="onboarding-create-with-telegram-button"]';

  private readonly onboardingImportWithTelegramButton =
    '[data-testid="onboarding-import-with-telegram-button"]';

  private readonly onboardingLoginFooterTermsOfUseLink =
    '[data-testid="onboarding-login-footer-terms-of-use"]';

  private readonly onboardingLoginFooterPrivacyNoticeLink =
    '[data-testid="onboarding-login-footer-privacy-notice"]';

  private readonly termsOfUseUrl = 'https://consensys.io/terms-of-use';

  private readonly privacyNoticeUrl = 'https://consensys.io/privacy-notice';

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

  async checkTermsOfUsageAndPrivacyLinksAreVisible(
    loginOption: 'create' | 'import' = 'create',
  ): Promise<void> {
    console.log('Checking onboarding login footer links are visible');
    const loginOptionsButton =
      loginOption === 'create'
        ? this.onboardingCreateWithSrpButton
        : this.onboardingImportWithSrpButton;
    await this.driver.waitForSelector(loginOptionsButton);
    await this.driver.waitForMultipleSelectors([
      this.onboardingLoginFooterTermsOfUseLink,
      this.onboardingLoginFooterPrivacyNoticeLink,
    ]);
  }

  async clickTermsOfUseLinkAndVerifyExpectedUrlOpens(): Promise<void> {
    await this.clickFooterLinkAndVerifyUrlOpens(
      this.onboardingLoginFooterTermsOfUseLink,
      this.termsOfUseUrl,
    );
  }

  async clickPrivacyNoticeLinkAndVerifyExpectedUrlOpens(): Promise<void> {
    await this.clickFooterLinkAndVerifyUrlOpens(
      this.onboardingLoginFooterPrivacyNoticeLink,
      this.privacyNoticeUrl,
    );
  }

  async clickCreateWalletButton(): Promise<void> {
    await this.driver.clickElement(this.createWalletButton);
  }

  async clickImportWalletButton(): Promise<void> {
    await this.driver.clickElement(this.importWalletButton);
  }

  async clickCreateWalletSocialLoginButton(
    authConnection = AuthConnection.Google,
  ): Promise<void> {
    const socialLoginButton =
      this.getCreateWalletSocialLoginButton(authConnection);

    await this.driver.waitForSelector(socialLoginButton);
    await this.driver.clickElement(socialLoginButton);
  }

  async clickImportWalletSocialLoginButton(
    authConnection = AuthConnection.Google,
  ): Promise<void> {
    const socialLoginButton =
      this.getImportWalletSocialLoginButton(authConnection);

    await this.driver.waitForSelector(socialLoginButton);
    await this.driver.clickElement(socialLoginButton);
  }

  async createWalletWithSrp(socialLoginEnabled = true): Promise<void> {
    await this.clickCreateWalletButton();
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
    await this.clickImportWalletButton();
    if (withSrpButton) {
      await this.driver.clickElement(this.onboardingImportWithSrpButton);
    }
  }

  async createWalletWithSocialLogin(
    authConnection = AuthConnection.Google,
  ): Promise<void> {
    await this.clickCreateWalletButton();
    await this.clickCreateWalletSocialLoginButton(authConnection);
  }

  async importWalletWithSocialLogin(
    authConnection = AuthConnection.Google,
  ): Promise<void> {
    await this.clickImportWalletButton();
    await this.clickImportWalletSocialLoginButton(authConnection);
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

  private getCreateWalletSocialLoginButton(
    authConnection: AuthConnection,
  ): string {
    switch (authConnection) {
      case AuthConnection.Google:
        return this.onboardingCreateWithGoogleButton;
      case AuthConnection.Apple:
        return this.onboardingCreateWithAppleButton;
      case AuthConnection.Telegram:
        return this.onboardingCreateWithTelegramButton;
      default:
        throw new Error('Unsupported social login connection');
    }
  }

  private getImportWalletSocialLoginButton(
    authConnection: AuthConnection,
  ): string {
    switch (authConnection) {
      case AuthConnection.Google:
        return this.onboardingImportWithGoogleButton;
      case AuthConnection.Apple:
        return this.onboardingImportWithAppleButton;
      case AuthConnection.Telegram:
        return this.onboardingImportWithTelegramButton;
      default:
        throw new Error('Unsupported social login connection');
    }
  }

  private async clickFooterLinkAndVerifyUrlOpens(
    linkSelector: string,
    expectedHref: string,
  ): Promise<void> {
    console.log(`Checking onboarding login footer link opens: ${expectedHref}`);

    const link = await this.driver.findClickableElement(linkSelector);
    assert.strictEqual(await link.getAttribute('href'), expectedHref);
    assert.strictEqual(await link.getAttribute('target'), '_blank');

    const originalHandle = await this.driver.getCurrentWindowHandle();
    const handlesBeforeClick = await this.driver.getAllWindowHandles();

    await this.driver.clickElement(linkSelector);

    await this.driver.waitUntil(
      async () => {
        const handles = await this.driver.getAllWindowHandles();
        if (handles.length <= handlesBeforeClick.length) {
          return false;
        }

        for (const handle of handles) {
          if (handle === originalHandle) {
            continue;
          }

          try {
            await this.driver.switchToWindow(handle);
            const url = await this.driver.getCurrentUrl();
            if (url.includes(expectedHref)) {
              return true;
            }
          } catch {
            // Handle may have closed or be in a transient state; ignore and keep searching.
          }
        }

        try {
          await this.driver.switchToWindow(originalHandle);
        } catch {
          // ignore
        }

        return false;
      },
      { interval: 200, timeout: 10000 },
    );

    await this.driver.switchToWindow(originalHandle);

    const handlesAfterClick = await this.driver.getAllWindowHandles();
    for (const handle of handlesAfterClick) {
      if (handle !== originalHandle) {
        await this.driver.closeWindowHandle(handle);
      }
    }

    await this.driver.switchToWindow(originalHandle);
  }
}

export default StartOnboardingPage;
