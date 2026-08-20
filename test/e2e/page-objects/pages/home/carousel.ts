import { Driver } from '../../../webdriver/driver';

/**
 * Home promotional carousel: stacked slides above the account overview tabs.
 *
 * Screen: `#/` (DEFAULT_ROUTE), rendered in the account overview layout above
 * the Tokens / DeFi / NFTs / Activity tabs.
 * Owns: the carousel container, current-slide title and description, and
 * dismissing one or many slides via their close buttons.
 * Boundaries: the carousel surface only. Balance, tab content, and home CTAs
 * belong to `HomePage` and the tab page objects.
 * Related: `HomePage` (host screen); dismiss before asserting on tabs when
 * slides would otherwise obscure the overview.
 *
 * @see ui/components/multichain/carousel/carousel.tsx
 */
export default class CarouselPage {
  private readonly carouselContainer = '[data-testid="carousel-container"]';

  private readonly carouselSlide =
    '[data-testid^="carousel-slide-"]:not([data-testid$="-close-button"])';

  private readonly currentSlide =
    '.carousel-card--current[data-testid^="carousel-slide-"]';

  private readonly currentSlideCloseButton =
    '.carousel-card--current [data-testid$="-close-button"]';

  private readonly currentSlideDescription =
    '.carousel-card--current [data-testid="carousel-slide-description"]';

  private readonly currentSlideTitle =
    '.carousel-card--current [data-testid="carousel-slide-title"]';

  private readonly driver: Driver;

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async checkCarouselIsNotVisible(): Promise<void> {
    console.log('Check carousel is not visible');
    await this.driver.assertElementNotPresent(this.carouselContainer, {
      waitAtLeastGuard: 1000,
    });
  }

  async checkCurrentSlideHasTitleAndDescription(): Promise<void> {
    console.log('Check current slide has title and description');
    await this.driver.waitForSelector(this.currentSlide);
    await this.driver.waitForSelector(this.currentSlideTitle);
    await this.driver.waitForSelector(this.currentSlideDescription);
  }

  async checkPageIsLoaded(): Promise<void> {
    console.log('Check carousel page is loaded');
    await this.driver.waitForSelector(this.carouselContainer);
    await this.driver.waitForSelector(this.currentSlide);
  }

  async dismissCurrentSlide(): Promise<void> {
    console.log('Dismiss current carousel slide');
    await this.driver.waitForElementToStopMoving(this.currentSlideCloseButton);
    await this.driver.clickElementAndWaitToDisappear(
      this.currentSlideCloseButton,
    );
  }

  async dismissSlides(maxToDismiss: number): Promise<void> {
    console.log(`Dismiss up to ${maxToDismiss} carousel slides`);

    for (let i = 0; i < maxToDismiss; i++) {
      // Check if the current slide has a close button because some car
      const hasCloseButton = await this.driver.isElementPresentAndVisible(
        this.currentSlideCloseButton,
      );

      if (!hasCloseButton) {
        return;
      }

      await this.dismissCurrentSlide();

      if (!(await this.isCarouselPresent())) {
        return;
      }

      const remaining = maxToDismiss - (i + 1);
      if (remaining > 0) {
        await this.driver.waitForSelector(this.currentSlide);
      }
    }
  }

  async isCarouselPresent(): Promise<boolean> {
    return this.driver.isElementPresentAndVisible(this.carouselContainer);
  }
}
