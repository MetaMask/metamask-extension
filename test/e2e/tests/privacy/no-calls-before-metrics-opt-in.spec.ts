import assert from 'assert';
import { Mockttp, MockedEndpoint } from 'mockttp';
import { withFixtures, regularDelayMs } from '../../helpers';
import FixtureBuilder from '../../fixture-builder';
import HomePage from '../../page-objects/pages/home/homepage';
import OnboardingMetricsPage from '../../page-objects/pages/onboarding/onboarding-metrics-page';
import OnboardingCompletePage from '../../page-objects/pages/onboarding/onboarding-complete-page';
import StartOnboardingPage from '../../page-objects/pages/onboarding/start-onboarding-page';
import {
  importSRPOnboardingFlow,
  createNewWalletOnboardingFlow,
} from '../../page-objects/flows/onboarding.flow';

// Mock function implementation for Infura requests
async function mockInfura(mockServer: Mockttp): Promise<MockedEndpoint[]> {
  return [
    await mockServer.forGet().thenCallback(() => {
      return {
        statusCode: 200,
        json: [{ fakedata: true }],
      };
    }),
    await mockServer.forPost().thenCallback(() => {
      return {
        statusCode: 200,
        json: [{ fakedata: true }],
      };
    }),
  ];
}

describe('MetaMask onboarding', function () {
  it("doesn't make any network requests to infura before create new wallet onboarding is completed", async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder({ onboarding: true })
          .withPreferencesController({
            useExternalServices: false,
          })
          .build(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockInfura,
      },
      async ({ driver, mockedEndpoint: mockedEndpoints }) => {
        await driver.navigate();
        const startOnboardingPage = new StartOnboardingPage(driver);
        await startOnboardingPage.check_pageIsLoaded();
        await startOnboardingPage.checkTermsCheckbox();
        await startOnboardingPage.clickCreateWalletButton();

        const onboardingMetricsPage = new OnboardingMetricsPage(driver);
        await onboardingMetricsPage.check_pageIsLoaded();

        // Check no requests are made before completing creat new wallet onboarding
        // Intended delay to ensure we cover at least 1 polling loop of time for the network request
        await driver.delay(regularDelayMs);
        for (const mockedEndpoint of mockedEndpoints) {
          const isPending = await mockedEndpoint.isPending();
          // assert.equal(
          //   isPending,
          //   true,
          //   `${mockedEndpoint} mock should still be pending before onboarding`,
          // );
          const requests = await mockedEndpoint.getSeenRequests();
          console.log('requests', requests);
          assert.equal(
            requests.length,
            0,
            `${mockedEndpoint} should make no requests before onboarding`,
          );
        }
      },
    );
  });
});
