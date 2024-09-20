import { Driver } from '../../webdriver/driver';

class LoginPage {
  private driver: Driver;

  private passwordInput: string;

  private unlockButton: string;

  private welcomeBackMessage: object;

  private forgotPasswordButton: object;

  constructor(driver: Driver) {
    this.driver = driver;
    this.passwordInput = '[data-testid="unlock-password"]';
    this.unlockButton = '[data-testid="unlock-submit"]';
    this.welcomeBackMessage = {
      css: '[data-testid="unlock-page-title"]',
      text: 'Welcome back!',
    };
    this.forgotPasswordButton = {
      text: 'Forgot password?',
      tag: 'a',
    };
  }

  async navigate(): Promise<void> {
    console.log('Navigating to login page');
    try {
      await this.driver.navigate();
      await this.check_pageIsLoaded();
      console.log('Successfully navigated to login page');
    } catch (error) {
      console.error('Failed to navigate to login page', error);
      throw new Error(
        `Unable to navigate to login page: ${(error as Error).message}`,
      );
    }
  }

  async login(password: string): Promise<void> {
    console.log('Logging in');
    try {
      await this.fillPassword(password);
      await this.clickUnlockButton();
      console.log('Login successful');
    } catch (error) {
      console.error('Failed to login', error);
      throw new Error(`Unable to login: ${(error as Error).message}`);
    }
  }

  async check_pageIsLoaded(): Promise<void> {
    console.log('Checking if login page is loaded');
    try {
      await this.driver.waitForMultipleSelectors([
        this.welcomeBackMessage,
        this.passwordInput,
        this.unlockButton,
      ]);
      console.log('Login page is loaded');
    } catch (error) {
      console.error('Timeout while waiting for login page to be loaded', error);
      throw new Error(`Login page failed to load: ${(error as Error).message}`);
    }
  }

  async fillPassword(password: string): Promise<void> {
    await this.driver.fill(this.passwordInput, password);
  }

  async clickUnlockButton(): Promise<void> {
    await this.driver.clickElement(this.unlockButton);
  }

  async gotoResetPasswordPage(): Promise<void> {
    console.log('Navigating to reset password page');
    await this.driver.clickElement(this.forgotPasswordButton);
  }
}

export default LoginPage;
