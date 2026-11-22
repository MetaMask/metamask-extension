import { withFixtures } from '../../helpers';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { login } from '../../page-objects/flows/login.flow';
import CarouselPage from '../../page-objects/pages/home/carousel';
import { MAX_SLIDES } from '../../../../ui/components/multichain/carousel/constants';

describe('Carousel component e2e tests', function () {
  it('renders slides and each visible slide has title and description', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }) => {
        await login(driver);

        const carouselPage = new CarouselPage(driver);

        if (!(await carouselPage.isCarouselPresent())) {
          return;
        }

        await carouselPage.checkPageIsLoaded();
        await carouselPage.checkCurrentSlideHasTitleAndDescription();
      },
    );
  });

  it('dismisses slides that are dismissable and hides the carousel when none remain', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }) => {
        await login(driver);

        const carouselPage = new CarouselPage(driver);

        if (!(await carouselPage.isCarouselPresent())) {
          await carouselPage.checkCarouselIsNotVisible();
          return;
        }

        await carouselPage.checkPageIsLoaded();

        await carouselPage.dismissSlides(MAX_SLIDES);

        await carouselPage.checkCarouselIsNotVisible();
      },
    );
  });
});
