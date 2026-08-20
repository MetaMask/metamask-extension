import { Suite } from 'mocha';
import { withFixtures } from '../../helpers';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { Driver } from '../../webdriver/driver';
import {
  lockAndWaitForLoginPage,
  login,
} from '../../page-objects/flows/login.flow';

describe('Lock and unlock', function (this: Suite) {
  it('successfully unlocks after lock', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver);

        await lockAndWaitForLoginPage(driver);
        await login(driver);
      },
    );
  });
});
