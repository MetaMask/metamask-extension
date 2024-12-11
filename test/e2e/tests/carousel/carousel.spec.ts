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

  it('should handle slide dismissal', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }) => {
        await loginWithBalanceValidation(driver);
        await driver.waitForSelector('.mm-carousel');
        await driver.delay(1000);

        // First verify we have all 4 slides
        const initialSlides = await driver.findElements('.mm-carousel-slide');
        assert.equal(initialSlides.length, 4);

        // Dismiss each slide one by one
        for (let i = 0; i < 4; i++) {
          const currentSlides = await driver.findElements('.mm-carousel-slide');
          assert.equal(
            currentSlides.length,
            4 - i,
            `Expected ${4 - i} slides remaining`,
          );

          const dismissButton = await driver.findElement(
            '.mm-carousel-slide:first-child .mm-carousel-slide__close-button',
          );
          await dismissButton.click();

          // Only wait for the next state if we're not on the last slide
          if (i < 3) {
            await driver.wait(async () => {
              const remainingSlides = await driver.findElements(
                '.mm-carousel-slide',
              );
              return remainingSlides.length === 3 - i;
            }, 1000);
          }
        }

        // Wait briefly for any animations to complete
        await driver.delay(500);

        // Verify carousel is no longer present
        const carouselExists = await driver.isElementPresent('.mm-carousel');
        assert.equal(
          carouselExists,
          false,
          'Carousel should no longer be visible',
        );
      },
    );
  });
});
