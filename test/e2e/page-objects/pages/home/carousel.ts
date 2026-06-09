import { Driver } from '../../../webdriver/driver';

const MAX_VISIBLE_SLIDES = 8;

class CarouselPage {
  private readonly carousel = '.mm-carousel';

  private readonly carouselSlide = '.mm-carousel-slide';

  private readonly driver: Driver;

  private readonly selectedSlide =
    '.mm-carousel .slide.selected .mm-carousel-slide';

  private readonly slideCloseButton = `${this.selectedSlide} .mm-carousel-slide__close-button`;

  private readonly slideDescription = '.mm-text--body-xs';

  private readonly slideDotButtons = '[aria-label^="slide item "]';

  private readonly slideTitle = '.mm-text--body-sm-medium';

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async checkCarouselIsNotVisible(): Promise<void> {
    console.log('Check carousel is not visible');
    await this.driver.assertElementNotPresent(this.carousel, {
      waitAtLeastGuard: 1000,
    });
  }

  async checkRemainingSlideIsNotDismissable(): Promise<void> {
    console.log('Check remaining slide is not dismissable');
    await this.clickSlideByIndex(0);
    await this.driver.assertElementNotPresent(this.slideCloseButton, {
      findElementGuard: this.selectedSlide,
    });
  }

  async checkSlideHasTitleAndDescription(slideIndex: number): Promise<void> {
    console.log(`Check slide ${slideIndex} has title and description`);
    await this.driver.waitForSelector(this.selectedSlide);

    const hasTitle = await this.driver.isElementPresentAndVisible(
      `${this.selectedSlide} ${this.slideTitle}`,
    );
    const hasDescription = await this.driver.isElementPresentAndVisible(
      `${this.selectedSlide} ${this.slideDescription}`,
    );

    if (!hasTitle) {
      throw new Error(`Slide ${slideIndex} should have a title`);
    }
    if (!hasDescription) {
      throw new Error(`Slide ${slideIndex} should have a description`);
    }
  }

  async clickSlideByIndex(index: number): Promise<void> {
    console.log(`Click carousel slide dot at index ${index}`);
    await this.driver.clickElement(this.slideDotButton(index));
  }

  async dismissAllSlides(): Promise<{ allDismissed: boolean }> {
    console.log('Dismiss all dismissable carousel slides');
    let previousCount = await this.getSlideCount();

    if (previousCount === 0) {
      throw new Error('Expected at least one slide to start');
    }

    for (let attempts = 0; attempts < MAX_VISIBLE_SLIDES * 2; attempts++) {
      await this.clickSlideByIndex(0);
      await this.driver.waitForSelector(this.selectedSlide);

      const hasCloseOnSelected = await this.driver.isElementPresentAndVisible(
        this.slideCloseButton,
      );

      if (hasCloseOnSelected) {
        await this.driver.waitForElementToStopMoving(this.slideCloseButton);
        await this.driver.clickElementAndWaitToDisappear(this.slideCloseButton);
      } else {
        const dots = await this.driver.findElements(this.slideDotButtons);
        let dismissedFromOther = false;

        for (let i = 1; i < dots.length; i++) {
          await this.clickSlideByIndex(i);
          await this.driver.waitForSelector(this.selectedSlide);

          const closeBtnHere = await this.driver.isElementPresentAndVisible(
            this.slideCloseButton,
          );
          if (closeBtnHere) {
            await this.driver.waitForElementToStopMoving(this.slideCloseButton);
            await this.driver.clickElementAndWaitToDisappear(
              this.slideCloseButton,
            );
            dismissedFromOther = true;
            break;
          }
        }

        if (!dismissedFromOther) {
          break;
        }
      }

      const prev = previousCount;
      await this.driver.wait(async () => {
        const nowCount = await this.getSlideCount();
        return nowCount < prev;
      }, 5000);

      const newCount = await this.getSlideCount();
      if (newCount < previousCount) {
        previousCount = newCount;
      }

      if (newCount === 0) {
        return { allDismissed: true };
      }
    }

    const remainingSlides = await this.getSlideCount();
    return { allDismissed: remainingSlides === 0 };
  }

  async getSlideCount(): Promise<number> {
    const slides = await this.driver.findElements(this.carouselSlide);
    return slides.length;
  }

  async getVisibleSlideCount(): Promise<number> {
    const slideCount = await this.getSlideCount();
    return Math.min(slideCount, MAX_VISIBLE_SLIDES);
  }

  async isCarouselPresent(): Promise<boolean> {
    return this.driver.isElementPresentAndVisible(this.carousel);
  }

  private slideDotButton(index: number): string {
    return `[aria-label="slide item ${index}"]`;
  }

  async waitForCarouselLoaded(): Promise<void> {
    console.log('Wait for carousel to load');
    await this.driver.waitForSelector(this.carousel);
    await this.driver.waitForSelector(this.carouselSlide);

    const slideCount = await this.getSlideCount();
    if (slideCount === 0) {
      throw new Error('Carousel should render at least one slide');
    }
  }
}

export default CarouselPage;
