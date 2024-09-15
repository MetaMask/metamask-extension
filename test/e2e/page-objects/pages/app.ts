import { Driver } from '../../webdriver/driver';
import { WALLET_PASSWORD } from '../../helpers';
import { BasePage } from './base-page';
import HeaderNavbar from './header-navbar';
import { SettingsPage } from './settings-page';
import HomePage from './homepage';
import LoginPage from './login-page';

// Top level page object for the app.
class App extends BasePage {
  async getHeaderNavbar(): Promise<HeaderNavbar> {
    // TODO: Ensure that the header navbar is visible.
    return new HeaderNavbar(this.driver);
  }

  async getLoginPage(): Promise<LoginPage> {
    return new LoginPage(this.driver).check_pageIsLoaded();
  }

  async openSettings(): Promise<SettingsPage> {
    const headerNavbar = await this.getHeaderNavbar();
    return headerNavbar.openSettings();
  }

  async login(password: string = WALLET_PASSWORD): Promise<HomePage> {
    const loginPage = await this.getLoginPage();
    return loginPage.login(password);
  }
}

export const getApp = (driver: Driver): App => {
  return new App(driver);
};
