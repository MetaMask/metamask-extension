import { strict as assert } from 'assert';
import { tinyDelayMs, withFixtures } from '../../helpers';
import FixtureBuilder from '../../fixture-builder';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';
import { MAX_SLIDES } from '../../../../ui/components/multichain/carousel/constants';
import type { Driver } from '../../webdriver/driver';

async function skipIfCarouselDisabled(driver: Driver, mochaCtx: Mocha.Context) {
  const exists = await driver.isElementPresent('.mm-carousel');
  if (!exists) {
    mochaCtx.skip();
  }
}
describe('Carousel component e2e tests', function () {
  const MAX_VISIBLE_SLIDES = MAX_SLIDES;
  const SLIDE_IDS = [
    'solana',
    'smartAccountUpgrade',
    'bridge',
    'fund',
    'card',
    'cash',
    'multiSrp',
    'backupAndSync',
  ];

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
        await skipIfCarouselDisabled(driver, this);

        await driver.waitForSelector('.mm-carousel');
        await driver.waitForSelector('.mm-carousel-slide');

        const slides = await driver.findElements('.mm-carousel-slide');
        assert.ok(slides.length > 0, 'Carousel should have slides');

        const slideIds = SLIDE_IDS;

        const firstSlideSelector = `[data-testid="slide-${slideIds[0]}"]`;
        await driver.waitForSelector(firstSlideSelector);
        for (
          let i = 0;
          i < Math.min(slideIds.length, MAX_VISIBLE_SLIDES);
          i++
        ) {
          if (i > 0) {
            await driver.clickElement(`[aria-label="slide item ${i}"]`);
            await driver.waitForSelector(
              `[data-testid="slide-${slideIds[i]}"]`,
            );
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
        manifestFlags: {
          // This flag is used to enable/disable the remote mode for the carousel
          // component, which will impact to the slides count.
          // - If this flag is not set, the slides count will be 4.
          // - If this flag is set, the slides count will be 5.
        },
      },
      async ({ driver }) => {
        // A hardcoded number of the expected slides counter.
        // It should be updated if the number of slides changes
        // in the carousel component.
        // Please refer to the `useCarouselManagement` hook.
        const visibleSlideCount = MAX_VISIBLE_SLIDES;
        const totalSlidesCount = SLIDE_IDS.length;

        await loginWithBalanceValidation(driver);
        await skipIfCarouselDisabled(driver, this);
        await driver.waitForSelector('.mm-carousel');
        await driver.waitForSelector('.mm-carousel-slide');

        const initialSlides = await driver.findElements('.mm-carousel-slide');
        assert.equal(initialSlides.length, visibleSlideCount);
        for (let i = 0; i < SLIDE_IDS.length; i++) {
          await driver.delay(tinyDelayMs);
          const currentSlides = await driver.findElements('.mm-carousel-slide');
          const remainingSlides = Math.min(
            totalSlidesCount - i,
            MAX_VISIBLE_SLIDES,
          );

          assert.equal(
            currentSlides.length,
            remainingSlides,
            `Expected ${remainingSlides} slides remaining`,
          );
          await driver.delay(tinyDelayMs);

          const dismissButtonSelector = `[data-testid="slide-${SLIDE_IDS[i]}"] button`;
          await driver.waitForSelector(dismissButtonSelector);
          await driver.waitForElementToStopMoving(dismissButtonSelector);
          await driver.clickElementAndWaitToDisappear(dismissButtonSelector);

          const slideCountAfterOneDismissed =
            totalSlidesCount - i > MAX_VISIBLE_SLIDES
              ? MAX_VISIBLE_SLIDES
              : totalSlidesCount - i - 1;

          // await driver.wait(until.stalenessOf(dismissButton), 5e3);

          if (i < slideCountAfterOneDismissed) {
            await driver.wait(async () => {
              const remainingSlidesAfter =
                await driver.findElements('.mm-carousel-slide');

              return (
                remainingSlidesAfter.length === slideCountAfterOneDismissed
              );
            }, 5e3);
          }
        }

        await driver.wait(async () => {
          const carouselExists = await driver.isElementPresent('.mm-carousel');
          return !carouselExists;
        }, 5e3);

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
