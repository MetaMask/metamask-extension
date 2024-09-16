import { DEFAULT_GANACHE_ETH_BALANCE_DEC } from '../../../constants';
import SendTokenPage from '../send/send-token-page';
import { BasePage } from '../base-page';
import { ActivityTab } from './activity-tab';

export default class HomePage extends BasePage {
  // Navigation elements
  private sendButton = '[data-testid="eth-overview-send"]';

  private activityTab = '[data-testid="account-overview__activity-tab"]';

  private tokensTab = '[data-testid="account-overview__asset-tab"]';

  // Balance display
  private balance = '[data-testid="eth-overview__primary-currency"]';

  async check_pageIsLoaded(): Promise<HomePage> {
    try {
      await this.driver.waitForMultipleSelectors([
        this.sendButton,
        this.activityTab,
        this.tokensTab,
      ]);
    } catch (e) {
      console.log('Timeout while waiting for home page to be loaded', e);
      throw e;
    }
    console.log('Home page is loaded');
    return this;
  }

  async check_expectedBalanceIsDisplayed(
    expectedBalance: string = DEFAULT_GANACHE_ETH_BALANCE_DEC,
  ): Promise<void> {
    try {
      await this.driver.waitForSelector({
        css: this.balance,
        text: `${expectedBalance} ETH`,
      });
      console.log(
        `Expected balance ${expectedBalance} ETH is displayed on homepage`,
      );
    } catch (e) {
      const balance = await this.driver.waitForSelector(this.balance);
      const currentBalance = parseFloat(await balance.getText());
      const errorMessage = `Expected balance ${expectedBalance} ETH, got balance ${currentBalance} ETH`;
      console.log(errorMessage, e);
      throw e;
    }
  }

  async startSendFlow(): Promise<SendTokenPage> {
    await this.driver.clickElement(this.sendButton);
    return new SendTokenPage(this.driver);
  }

  async gotoActivityTab(): Promise<ActivityTab> {
    console.log(`Open activity tab on homepage`);
    await this.driver.clickElement(this.activityTab);
    return new ActivityTab(this.driver);
  }
}
