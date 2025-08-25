import assert from 'assert';
import { Mockttp, MockedEndpoint } from 'mockttp';
import { withFixtures, regularDelayMs } from '../../helpers';
import FixtureBuilder from '../../fixture-builder';
import HomePage from '../../page-objects/pages/home/homepage';
import OnboardingCompletePage from '../../page-objects/pages/onboarding/onboarding-complete-page';
import {
  importSRPOnboardingFlow,
  createNewWalletOnboardingFlow,
} from '../../page-objects/flows/onboarding.flow';

// Mock function implementation for Token Price requests
async function mockTokenPriceApi(
  mockServer: Mockttp,
): Promise<MockedEndpoint[]> {
  return [
    // mainnet
    await mockServer
      .forGet('https://price.api.cx.metamask.io/v2/chains/1/spot-prices')
      .thenCallback(() => ({
        statusCode: 200,
        json: {},
      })),
  ];
}

describe('MetaMask onboarding', function () {
  it("doesn't make any token price API requests before create new wallet onboarding is completed", async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder({ onboarding: true })
          .withNetworkControllerOnMainnet()
          .withEnabledNetworks({
            eip155: {
              '0x1': true,
            },
          })
          .build(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockTokenPriceApi,
      },
      async ({ driver, mockedEndpoint: mockedEndpoints }) => {
        await createNewWalletOnboardingFlow({ driver });

        // Check no requests are made before completing creat new wallet onboarding
        // Intended delay to ensure we cover at least 1 polling loop of time for the network request
        await driver.delay(regularDelayMs);
        for (const mockedEndpoint of mockedEndpoints) {
          const isPending = await mockedEndpoint.isPending();
          assert.equal(
            isPending,
            true,
            `${mockedEndpoint} mock should still be pending before onboarding`,
          );
          const requests = await mockedEndpoint.getSeenRequests();
          assert.equal(
            requests.length,
            0,
            `${mockedEndpoint} should make no requests before onboarding`,
          );
        }

        // complete create new wallet onboarding
        const onboardingCompletePage = new OnboardingCompletePage(driver);
        await onboardingCompletePage.checkPageIsLoaded();
        await onboardingCompletePage.completeOnboarding();
        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();

        // network requests happen here
        for (const mockedEndpoint of mockedEndpoints) {
          await driver.wait(async () => {
            const isPending = await mockedEndpoint.isPending();
            return isPending === false;
          }, driver.timeout);

          const requests = await mockedEndpoint.getSeenRequests();
          assert.equal(
            requests.length > 0,
            true,
            `${mockedEndpoint} should make requests after onboarding`,
          );
        }
      },
    );
  });

  it("doesn't make any token price API requests before onboarding by import is completed", async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder({ onboarding: true })
          .withNetworkControllerOnMainnet()
          .withEnabledNetworks({
            eip155: {
              '0x1': true,
            },
          })
          .build(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockTokenPriceApi,
      },
      async ({ driver, mockedEndpoint: mockedEndpoints }) => {
        await importSRPOnboardingFlow({ driver });

        // Check no requests before completing onboarding
        // Intended delay to ensure we cover at least 1 polling loop of time for the network request
        await driver.delay(regularDelayMs);
        for (const mockedEndpoint of mockedEndpoints) {
          const requests = await mockedEndpoint.getSeenRequests();
          assert.equal(
            requests.length,
            0,
            `${mockedEndpoint} should make no requests before import wallet onboarding complete`,
          );
        }

        // complete import wallet onboarding
        const onboardingCompletePage = new OnboardingCompletePage(driver);
        await onboardingCompletePage.checkPageIsLoaded();
        await onboardingCompletePage.completeOnboarding();
        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();

        // requests happen here
        for (const mockedEndpoint of mockedEndpoints) {
          await driver.wait(async () => {
            const isPending = await mockedEndpoint.isPending();
            return isPending === false;
          }, driver.timeout);

          const requests = await mockedEndpoint.getSeenRequests();
          assert.equal(
            requests.length > 0,
            true,
            `${mockedEndpoint} should make requests after onboarding`,
          );
        }
      },
    );
  });
});
