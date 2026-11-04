import { tEn } from '../../../../lib/i18n-helpers';
import { Driver } from '../../../webdriver/driver';

/**
 * The Money account first-time-user splash (`money-ftue-splash`).
 *
 * Screen: modal/page overlay shown on the first Money interaction.
 * Owns: waiting for the splash and its primary/close actions.
 * Boundaries: the Money home behind it belongs to `MoneyHomePage`.
 * Related: `MoneyHomePage`, `BottomNavBar`.
 *
 * @see ui/components/app/money/money-ftue-splash/money-ftue-splash.tsx
 */
class MoneyFtueSplashPage {
  private readonly closeButton = { testId: 'money-ftue-splash-close-button' };

  private readonly driver: Driver;

  private readonly headline = {
    xpath: `//*[@data-testid='money-ftue-splash-headline'][normalize-space(.)='${tEn(
      'moneyFtueHeadline',
    )}']`,
  };

  private readonly page = { testId: 'money-ftue-splash' };

  private readonly startEarningButton = {
    testId: 'money-ftue-splash-start-earning-button',
  };

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async checkIsNotShown(): Promise<void> {
    console.log('Check the Money FTUE splash is not shown');
    await this.driver.assertElementNotPresent(this.page);
  }

  async checkPageIsLoaded(): Promise<void> {
    console.log('Wait for the Money FTUE splash to load');
    await this.driver.waitForSelector(this.page);
    await this.driver.waitForSelector(this.headline);
  }

  async clickClose(): Promise<void> {
    console.log('Click the Money FTUE splash close button');
    await this.driver.clickElement(this.closeButton);
  }

  async clickStartEarning(): Promise<void> {
    console.log('Click the Money FTUE splash Start earning button');
    await this.driver.clickElement(this.startEarningButton);
  }
}

export default MoneyFtueSplashPage;
