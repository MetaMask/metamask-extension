import { withFixtures } from '../helpers';
import FixtureBuilder from '../fixture-builder';
import TestDapp from '../page-objects/pages/test-dapp';
import { loginWithBalanceValidation } from '../page-objects/flows/login.flow';

describe('Multi injected provider interactions', function () {
  it('should check for multiple providers', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder().build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }) => {
        await loginWithBalanceValidation(driver);
        const testDapp = new TestDapp(driver);
        await testDapp.openTestDappPage();
        await testDapp.checkPageIsLoaded();
        await testDapp.checkProviderNumber(2);
      },
    );
  });
});
