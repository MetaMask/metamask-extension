import { strict as assert } from 'assert';
import { tinyDelayMs, withFixtures } from '../../helpers';
import FixtureBuilder from '../../fixture-builder';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';
import { MAX_SLIDES } from '../../../../ui/components/multichain/carousel/constants';

describe('Carousel component e2e tests', function () {
  const MAX_VISIBLE_SLIDES = MAX_SLIDES;
  const selectedSlideSelector =
    '.mm-carousel .slide.selected .mm-carousel-slide';

  it('renders slides and each visible slide has title & description', async function () {
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
        await driver.waitForSelector('.mm-carousel-slide');

        const slides = await driver.findElements('.mm-carousel-slide');
        assert.ok(
          slides.length > 0,
          'Carousel should render at least one slide',
        );

        const visibleCount = Math.min(slides.length, MAX_VISIBLE_SLIDES);

        for (let i = 0; i < visibleCount; i++) {
          if (i > 0) {
            await driver.clickElement(`[aria-label="slide item ${i}"]`);
          }
          const current = await driver.waitForSelector(selectedSlideSelector);

          const hasTitle = await driver.isDescendantPresent(
            current,
            '.mm-text--body-sm-medium',
          );
          const hasDescription = await driver.isDescendantPresent(
            current,
            '.mm-text--body-xs',
          );

          assert.ok(hasTitle, `Slide ${i} should have a title`);
          assert.ok(hasDescription, `Slide ${i} should have a description`);

          await driver.delay(tinyDelayMs);
        }
      },
    );
  });

  it('dismisses slides that are dismissable and hides the carousel when none remain', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }) => {
        await loginWithBalanceValidation(driver);
        await driver.waitForSelector('.mm-carousel');
        await driver.waitForSelector('.mm-carousel-slide');

        let previousCount = (await driver.findElements('.mm-carousel-slide'))
          .length;
        assert.ok(previousCount > 0, 'Expected at least one slide to start');

        // Try to dismiss until no slides left or no dismissable slides remain
        for (let attempts = 0; attempts < MAX_VISIBLE_SLIDES * 2; attempts++) {
          await driver.clickElement('[aria-label="slide item 0"]');

          await driver.waitForSelector(selectedSlideSelector);

          const closeBtnSel = `${selectedSlideSelector} .mm-carousel-slide__close-button`;
          const hasCloseOnSelected = await driver.isElementPresent(closeBtnSel);

          if (hasCloseOnSelected) {
            await driver.waitForElementToStopMoving(closeBtnSel);
            await driver.clickElementAndWaitToDisappear(closeBtnSel);
          } else {
            // Seek a slide with a close button
            const dots = await driver.findElements(
              '[aria-label^="slide item "]',
            );
            let dismissedFromOther = false;

            for (let i = 1; i < dots.length; i++) {
              await driver.clickElement(`[aria-label="slide item ${i}"]`);
              await driver.waitForSelector(selectedSlideSelector);

              const closeBtnHere = await driver.isElementPresent(closeBtnSel);
              if (closeBtnHere) {
                await driver.waitForElementToStopMoving(closeBtnSel);
                await driver.clickElementAndWaitToDisappear(closeBtnSel);
                dismissedFromOther = true;
                break;
              }
            }

            if (!dismissedFromOther) {
              // No dismissable slides found; stop trying
              break;
            }
          }

          // Wait for count to drop, tolerate timing
          const prev = previousCount;
          await driver.wait(async () => {
            const nowCount = (await driver.findElements('.mm-carousel-slide'))
              .length;
            return nowCount < prev;
          }, 5000);

          const newCount = (await driver.findElements('.mm-carousel-slide'))
            .length;
          if (newCount < previousCount) {
            previousCount = newCount;
          }

          if (newCount === 0) {
            break;
          }

          await driver.delay(tinyDelayMs);
        }

        const remainingSlides = await driver.findElements('.mm-carousel-slide');
        if (remainingSlides.length === 0) {
          const carouselExists = await driver.isElementPresent('.mm-carousel');
          assert.equal(
            carouselExists,
            false,
            'Carousel should no longer be visible',
          );
        } else {
          // If slides remain, they should be undismissable
          await driver.clickElement('[aria-label="slide item 0"]');

          await driver.waitForSelector(selectedSlideSelector);
          const stillHasClose = await driver.isElementPresent(
            `${selectedSlideSelector} .mm-carousel-slide__close-button`,
          );
          assert.equal(
            stillHasClose,
            false,
            'Remaining slide(s) should be undismissable',
          );
        }
      },
    );
  });
});
