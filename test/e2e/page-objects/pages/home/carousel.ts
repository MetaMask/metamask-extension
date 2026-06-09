import { Driver } from '../../../webdriver/driver';

const MAX_VISIBLE_SLIDES = 8;

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

  async checkRemainingSlideIsNotDismissable(): Promise<void> {
    console.log('Check remaining slide is not dismissable');
    await this.driver.waitForSelector(this.currentSlide);
    await this.driver.assertElementNotPresent(this.currentSlideCloseButton, {
      findElementGuard: this.currentSlide,
    });
  }

  async dismissAllSlides(): Promise<{ allDismissed: boolean }> {
    console.log('Dismiss all dismissable carousel slides');

    if (!(await this.isCarouselPresent())) {
      return { allDismissed: true };
    }

    await this.waitForCarouselLoaded();

    for (let attempts = 0; attempts < MAX_VISIBLE_SLIDES * 2; attempts++) {
      if (!(await this.isCarouselPresent())) {
        return { allDismissed: true };
      }

      const hasCloseButton = await this.driver.isElementPresentAndVisible(
        this.currentSlideCloseButton,
      );

      if (!hasCloseButton) {
        break;
      }

      const previousSlideId = await this.getCurrentSlideTestId();
      await this.dismissCurrentSlide();

      if (!(await this.isCarouselPresent())) {
        return { allDismissed: true };
      }

      await this.driver.wait(async () => {
        const currentSlideId = await this.getCurrentSlideTestId();
        return currentSlideId !== previousSlideId;
      }, 5000);
    }

    return { allDismissed: !(await this.isCarouselPresent()) };
  }

  async dismissCurrentSlide(): Promise<void> {
    console.log('Dismiss current carousel slide');
    await this.driver.waitForElementToStopMoving(this.currentSlideCloseButton);
    await this.driver.clickElementAndWaitToDisappear(
      this.currentSlideCloseButton,
    );
  }

  private async getCurrentSlideTestId(): Promise<string | null> {
    try {
      const currentSlide = await this.driver.findElement(this.currentSlide);
      return currentSlide.getAttribute('data-testid');
    } catch {
      return null;
    }
  }

  async getSlideCount(): Promise<number> {
    const slides = await this.driver.findElements(this.carouselSlide);
    return slides.length;
  }

  async isCarouselPresent(): Promise<boolean> {
    return this.driver.isElementPresentAndVisible(this.carouselContainer);
  }

  async waitForCarouselLoaded(): Promise<void> {
    console.log('Wait for carousel to load');
    await this.driver.waitForSelector(this.carouselContainer);
    await this.driver.waitForSelector(this.currentSlide);

    const slideCount = await this.getSlideCount();
    if (slideCount === 0) {
      throw new Error('Carousel should render at least one slide');
    }
  }
}
