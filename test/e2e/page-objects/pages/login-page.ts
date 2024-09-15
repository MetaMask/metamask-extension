import HomePage from './homepage';
import { BasePage } from './base-page';

class LoginPage extends BasePage {
  private passwordInput = '[data-testid="unlock-password"]';

  private unlockButton = '[data-testid="unlock-submit"]';

  private welcomeBackMessage = {
    css: '[data-testid="unlock-page-title"]',
    text: 'Welcome back!',
  };

  async check_pageIsLoaded(): Promise<LoginPage> {
    try {
      await this.driver.waitForMultipleSelectors([
        this.welcomeBackMessage,
        this.passwordInput,
        this.unlockButton,
      ]);
    } catch (e) {
      console.log('Timeout while waiting for login page to be loaded', e);
      throw e;
    }
    console.log('Login page is loaded');
    return this;
  }

  async fillPassword(password: string): Promise<void> {
    await this.driver.fill(this.passwordInput, password);
  }

  async clickUnlockButton(): Promise<void> {
    await this.driver.clickElement(this.unlockButton);
  }

  // user lands on homepage after logging in with password
  async login(password: string): Promise<HomePage> {
    await this.fillPassword(password);
    await this.clickUnlockButton();
    return new HomePage(this.driver).check_pageIsLoaded();
  }
}

export default LoginPage;
