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
});
