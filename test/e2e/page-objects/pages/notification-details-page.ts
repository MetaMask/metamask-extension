import { Driver } from '../../webdriver/driver';

class NotificationDetailsPage {
  private driver: Driver;

  private readonly detailsPageBackButton =
    '[data-testid="notification-details-back-button"]';

  private readonly multichainPage =
    '[data-testid="multichain-page"].mm-box--width-full.mm-box--height-full';

  private readonly snapAvatarIcon = (text: string) => ({
    css: '[data-testid="notification-details-snap-avatar"]',
    text,
  });

  private readonly snapName = (text: string) => ({
    css: '[data-testid="notification-details-snap-name"]',
    text,
  });

  private readonly snapNotificationHeading = (text: string) => ({
    css: '[data-testid="notification-details-title"]',
    text,
  });

  private readonly snapUiMarkdownText = (text: string) => ({
    css: '[data-testid="snap-ui-markdown-text"]',
    text,
  });

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async checkPageIsLoaded(): Promise<void> {
    try {
      await this.driver.waitForMultipleSelectors([this.detailsPageBackButton]);
    } catch (e) {
      console.log(
        'Timeout while waiting for Notifications Details page to be loaded',
        e,
      );
      throw e;
    }
    console.log('Notifications Details page is loaded');
  }

  async checkExpandedViewIsFullPage(): Promise<void> {
    console.log('Validating expanded view notification');
    await this.driver.waitForSelector(this.multichainPage);
  }

  async checkNotificationContent({
    avatarInitial,
    heading,
    markdownText,
    snapName,
  }: {
    avatarInitial: string;
    heading: string;
    markdownText: string;
    snapName: string;
  }): Promise<void> {
    console.log('Validating notification details');

    await this.driver.waitForSelector(this.snapNotificationHeading(heading));

    await this.driver.waitForSelector(this.snapAvatarIcon(avatarInitial));

    await this.driver.waitForSelector(this.snapName(snapName));

    await this.driver.waitForSelector(this.snapUiMarkdownText(markdownText));
  }

  async clickBackButton(): Promise<void> {
    console.log(
      `On notification details page, navigating back to notification list page`,
    );
    await this.driver.clickElement(this.detailsPageBackButton);
  }
}

export default NotificationDetailsPage;
