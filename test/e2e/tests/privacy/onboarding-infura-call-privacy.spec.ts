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

// Mock function implementation for Infura requests
async function mockInfura(mockServer: Mockttp): Promise<MockedEndpoint[]> {
  const infuraUrl =
    'https://mainnet.infura.io/v3/00000000000000000000000000000000';
  const sampleAddress = '1111111111111111111111111111111111111111';
  return [
    await mockServer
      .forPost(infuraUrl)
      .withJsonBodyIncluding({ method: 'eth_blockNumber' })
      .thenCallback(() => {
        return {
          statusCode: 200,
          json: {
            jsonrpc: '2.0',
            id: '1111111111111111',
            result: '0x1',
          },
        };
      }),
    await mockServer
      .forPost(infuraUrl)
      .withJsonBodyIncluding({ method: 'eth_getBalance' })
      .thenCallback(() => {
        return {
          statusCode: 200,
          json: {
            jsonrpc: '2.0',
            id: '1111111111111111',
            result: '0x0',
          },
        };
      }),
    await mockServer
      .forPost(infuraUrl)
      .withJsonBodyIncluding({ method: 'eth_getBlockByNumber' })
      .thenCallback(() => {
        return {
          statusCode: 200,
          json: {
            jsonrpc: '2.0',
            id: '1111111111111111',
            result: {},
          },
        };
      }),
    await mockServer
      .forPost(infuraUrl)
      .withJsonBodyIncluding({ method: 'eth_call' })
      .thenCallback(() => {
        return {
          statusCode: 200,
          json: {
            jsonrpc: '2.0',
            id: '1111111111111111',
            result: `0x000000000000000000000000${sampleAddress}`,
          },
        };
      }),
    await mockServer
      .forPost(infuraUrl)
      .withJsonBodyIncluding({ method: 'net_version' })
      .thenCallback(() => {
        return {
          statusCode: 200,
          json: { id: 8262367391254633, jsonrpc: '2.0', result: '1337' },
        };
      }),
  ];
}

describe('MetaMask onboarding', function () {
  it("doesn't make any network requests to infura before create new wallet onboarding is completed", async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder({ onboarding: true })
          .withNetworkControllerOnMainnet()
          .build(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockInfura,
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
        await onboardingCompletePage.check_pageIsLoaded();
        await onboardingCompletePage.completeOnboarding();
        const homePage = new HomePage(driver);
        await homePage.check_pageIsLoaded();

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

  it("doesn't make any network requests to infura before onboarding by import is completed", async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder({ onboarding: true })
          .withNetworkControllerOnMainnet()
          .build(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockInfura,
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
        await onboardingCompletePage.check_pageIsLoaded();
        await onboardingCompletePage.completeOnboarding();
        const homePage = new HomePage(driver);
        await homePage.check_pageIsLoaded();

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
