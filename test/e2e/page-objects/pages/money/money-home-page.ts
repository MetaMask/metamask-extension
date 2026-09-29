import { tEn } from '../../../../lib/i18n-helpers';
import { Driver } from '../../../webdriver/driver';

// A deposit only shows up as "Converted" once the source leg is mined on
// Anvil, Relay status polling completes and the sponsored Monad vault batch is
// relayed and confirmed, so give the activity assertions extra room.
const ACTIVITY_SETTLED_TIMEOUT = 90_000;

/**
 * The Money home page (`#/money-home`): balance, Add / Send actions, and the
 * recent activity preview.
 *
 * Screen: `#/money-home`, reached via the bottom nav Money tab.
 * Owns: page-loaded check, the Add action, and activity rows (label, fiat
 * amount, click-through).
 * Boundaries: the deposit confirmation opened by Add belongs to
 * `MoneyAccountDepositConfirmation`; activity row details belong to
 * `MoneyTransactionDetailsPage`.
 * Related: `BottomNavBar` (how tests get here).
 *
 * @see ui/pages/money/money-home-page.tsx
 */
class MoneyHomePage {
  private readonly activityList = { testId: 'money-activity-list' };

  private readonly activityRow = (label: string) => ({
    xpath: `//*[@data-testid='money-activity-list']//*[starts-with(@data-testid,'money-activity-row-') and not(contains(@data-testid,'-primary-')) and not(contains(@data-testid,'-fiat-'))][.//*[normalize-space(text())='${label}']]`,
  });

  private readonly activityRowFiat = (label: string, fiatAmount: string) => ({
    xpath: `${this.activityRow(label).xpath}//*[starts-with(@data-testid,'money-activity-row-fiat-')][normalize-space(text())='${fiatAmount}']`,
  });

  private readonly addButton = { testId: 'money-add-button' };

  private readonly balance = { testId: 'money-balance' };

  private readonly driver: Driver;

  private readonly loadingSkeleton = { testId: 'money-home-loading' };

  private readonly page = { testId: 'money-home-page' };

  constructor(driver: Driver) {
    this.driver = driver;
  }

  /**
   * Wait for an activity row with the given label and fiat amount, e.g.
   * `Converted` / `+$50.00`.
   *
   * @param label - Row label (already translated), e.g. `tEn('moneyActivityConverted')`.
   * @param fiatAmount - Fiat amount text as rendered, e.g. `+$50.00`.
   */
  async checkActivityItem(label: string, fiatAmount: string): Promise<void> {
    console.log(`Wait for Money activity row "${label}" ${fiatAmount}`);
    await this.driver.waitForSelector(this.activityList, {
      timeout: ACTIVITY_SETTLED_TIMEOUT,
    });
    await this.driver.waitForSelector(this.activityRowFiat(label, fiatAmount), {
      timeout: ACTIVITY_SETTLED_TIMEOUT,
    });
  }

  async checkConvertedActivity(fiatAmount: string): Promise<void> {
    await this.checkActivityItem(tEn('moneyActivityConverted'), fiatAmount);
  }

  async checkPageIsLoaded(): Promise<void> {
    console.log('Wait for Money home page to load');
    await this.driver.waitForSelector(this.page);
    await this.driver.assertElementNotPresent(this.loadingSkeleton, {
      waitAtLeastGuard: 0,
    });
    await this.driver.waitForSelector(this.balance);
  }

  async clickActivityItem(label: string): Promise<void> {
    console.log(`Click Money activity row "${label}"`);
    await this.driver.clickElement(this.activityRow(label));
  }

  async clickAdd(): Promise<void> {
    console.log('Click Money home Add action');
    await this.driver.waitForSelector(this.addButton, { state: 'enabled' });
    await this.driver.clickElement(this.addButton);
  }
}

export default MoneyHomePage;
