import { strict as assert } from 'assert';
import { withFixtures } from '../../helpers';
import FixtureBuilder from '../../fixture-builder';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';

describe('Carousel component e2e tests', () => {
  it('should display correct slides with expected content', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }) => {
        await loginWithBalanceValidation(driver);

        await driver.waitForSelector(
          '[data-testid="eth-overview__primary-currency"]',
        );

        await driver.waitForSelector('.mm-carousel');
        await driver.delay(1000);

        const slides = await driver.findElements('.mm-carousel-slide');
        assert.ok(slides.length > 0, 'Carousel should have slides');

        const slideIds = ['bridge', 'card', 'fund', 'cash'];

        const firstSlideSelector = `[data-testid="slide-${slideIds[0]}"]`;
        await driver.waitForSelector(firstSlideSelector);

        for (let i = 0; i < slideIds.length; i++) {
          if (i > 0) {
            const dots = await driver.findElements('.dot');
            await dots[i].click();
            await driver.delay(1000);
          }

          const slideSelector = `[data-testid="slide-${slideIds[i]}"]`;
          const currentSlide = await driver.waitForSelector(slideSelector);
          assert.ok(
            currentSlide,
            `Slide with data-testid="slide-${slideIds[i]}" should exist`,
          );

          const hasTitle = await driver.isElementPresent(
            `${slideSelector} .mm-text--body-sm-medium`,
          );
          const hasDescription = await driver.isElementPresent(
            `${slideSelector} .mm-text--body-xs`,
          );

          assert.ok(hasTitle, `Slide ${slideIds[i]} should have a title`);
          assert.ok(
            hasDescription,
            `Slide ${slideIds[i]} should have a description`,
          );
        }
      },
    );
  });

  it('should handle slide dismissal correctly', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }) => {
        await loginWithBalanceValidation(driver);
        await driver.waitForSelector('.mm-carousel');
        await driver.delay(1000);

        const initialSlides = await driver.findElements('.mm-carousel-slide');
        const initialCount = initialSlides.length;
        assert.ok(initialCount > 0, 'Carousel should have slides initially');

        const firstSlideCloseButton = await driver.findElement(
          '.mm-carousel-slide:first-child .mm-carousel-slide__close-button',
        );
        await firstSlideCloseButton.click();
        await driver.delay(500);

        const remainingSlides = await driver.findElements('.mm-carousel-slide');
        assert.equal(
          remainingSlides.length,
          initialCount - 1,
          'One slide should be removed after clicking close',
        );

        const dots = await driver.findElements('.dot');
        const hasSelectedDot = await driver.isElementPresent('.dot.selected');
        assert.ok(
          hasSelectedDot,
          'Should have a selected dot after closing a slide',
        );
        assert.equal(
          dots.length,
          remainingSlides.length,
          'Number of dots should match number of remaining slides',
        );

        await Promise.all(
          remainingSlides.map(async () => {
            const closeButton = await driver.findElement(
              '.mm-carousel-slide:first-child .mm-carousel-slide__close-button',
            );
            await closeButton.click();
            await driver.delay(500);
          }),
        );

        const carouselExists = await driver.isElementPresent('.mm-carousel');
        assert.ok(
          !carouselExists,
          'Carousel should not be present after all slides are closed',
        );
      },
    );
  });
});
