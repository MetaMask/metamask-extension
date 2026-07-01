import assert from 'assert';
import { Mockttp, MockedEndpoint } from 'mockttp';
import { withFixtures, regularDelayMs } from '../../helpers';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { NETWORK_CLIENT_ID } from '../../constants';
import { Driver } from '../../webdriver/driver';
import HomePage from '../../page-objects/pages/home/homepage';
import OnboardingCompletePage from '../../page-objects/pages/onboarding/onboarding-complete-page';
import {
  importSRPOnboardingFlow,
  createNewWalletOnboardingFlow,
  handleSidepanelPostOnboarding,
} from '../../page-objects/flows/onboarding.flow';

type OnboardingPrivacyMocks = {
  infuraMocks: MockedEndpoint[];
  accountsApiBalancesMock: MockedEndpoint;
};

// Mock Infura RPC and Accounts API v5 balances. With assetsUnifyState enabled,
// post-onboarding balance polling uses Accounts API v5 instead of Infura RPC.
async function mockOnboardingPrivacyEndpoints(
  mockServer: Mockttp,
): Promise<MockedEndpoint[]> {
  const infuraUrl =
    'https://mainnet.infura.io/v3/00000000000000000000000000000000';
  const sampleAddress = '1111111111111111111111111111111111111111';
  const infuraMocks = [
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

  const accountsApiBalancesMock = await mockServer
    .forGet(
      /^https:\/\/accounts\.api\.cx\.metamask\.io\/v5\/multiaccount\/balances/u,
    )
    .always()
    .thenCallback(() => ({
      statusCode: 200,
      json: {
        count: 0,
        balances: [],
        unprocessedNetworks: [],
      },
    }));

  return [...infuraMocks, accountsApiBalancesMock];
}

function splitOnboardingPrivacyMocks(
  mockedEndpoints: MockedEndpoint[],
): OnboardingPrivacyMocks {
  return {
    infuraMocks: mockedEndpoints.slice(0, -1),
    accountsApiBalancesMock: mockedEndpoints[mockedEndpoints.length - 1],
  };
}

async function assertNoInfuraRequestsBeforeOnboarding(
  infuraMocks: MockedEndpoint[],
): Promise<void> {
  for (const [index, mockedEndpoint] of infuraMocks.entries()) {
    const isPending = await mockedEndpoint.isPending();
    assert.equal(
      isPending,
      true,
      `Infura mock ${index} should still be pending before onboarding`,
    );
    const requests = await mockedEndpoint.getSeenRequests();
    assert.equal(
      requests.length,
      0,
      `Infura mock ${index} should make no requests before onboarding`,
    );
  }
}

async function waitForPostOnboardingNetworkActivity(
  driver: Driver,
  infuraMocks: MockedEndpoint[],
  accountsApiBalancesMock: MockedEndpoint,
  timeoutMs: number,
): Promise<void> {
  await driver.wait(async () => {
    const accountsApiRequests = await accountsApiBalancesMock.getSeenRequests();
    if (accountsApiRequests.length > 0) {
      return true;
    }

    for (const mockedEndpoint of infuraMocks) {
      if (!(await mockedEndpoint.isPending())) {
        return true;
      }
    }

    return false;
  }, timeoutMs);

  const accountsApiRequests = await accountsApiBalancesMock.getSeenRequests();
  const infuraRequests = (
    await Promise.all(infuraMocks.map((mock) => mock.getSeenRequests()))
  ).flat();

  assert.equal(
    accountsApiRequests.length > 0 || infuraRequests.length > 0,
    true,
    'Expected Accounts API v5 or Infura requests after onboarding',
  );
}

describe('MetaMask onboarding', function () {
  it("doesn't make any network requests to infura before create new wallet onboarding is completed", async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2({ onboarding: true })
          .withSelectedNetwork(NETWORK_CLIENT_ID.MAINNET)
          .build(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockOnboardingPrivacyEndpoints,
      },
      async ({ driver, mockedEndpoint: mockedEndpoints }) => {
        const { infuraMocks, accountsApiBalancesMock } =
          splitOnboardingPrivacyMocks(mockedEndpoints);

        await createNewWalletOnboardingFlow({ driver });

        // Check no requests are made before completing creat new wallet onboarding
        // Intended delay to ensure we cover at least 1 polling loop of time for the network request
        await driver.delay(regularDelayMs);
        await assertNoInfuraRequestsBeforeOnboarding(infuraMocks);

        // complete create new wallet onboarding
        const onboardingCompletePage = new OnboardingCompletePage(driver);
        await onboardingCompletePage.checkPageIsLoaded();
        await onboardingCompletePage.completeOnboarding();

        // Handle sidepanel navigation if needed
        await handleSidepanelPostOnboarding(driver);

        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();

        await waitForPostOnboardingNetworkActivity(
          driver,
          infuraMocks,
          accountsApiBalancesMock,
          driver.timeout,
        );
      },
    );
  });

  it("doesn't make any network requests to infura before onboarding by import is completed", async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2({ onboarding: true })
          .withSelectedNetwork(NETWORK_CLIENT_ID.MAINNET)
          .build(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockOnboardingPrivacyEndpoints,
      },
      async ({ driver, mockedEndpoint: mockedEndpoints }) => {
        const { infuraMocks, accountsApiBalancesMock } =
          splitOnboardingPrivacyMocks(mockedEndpoints);

        await importSRPOnboardingFlow({ driver });

        // Check no requests before completing onboarding
        // Intended delay to ensure we cover at least 1 polling loop of time for the network request
        await driver.delay(regularDelayMs);
        await assertNoInfuraRequestsBeforeOnboarding(infuraMocks);

        // complete import wallet onboarding
        const onboardingCompletePage = new OnboardingCompletePage(driver);
        await onboardingCompletePage.checkPageIsLoaded();
        await onboardingCompletePage.completeOnboarding();

        // Handle sidepanel navigation if needed
        await handleSidepanelPostOnboarding(driver);

        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();

        await waitForPostOnboardingNetworkActivity(
          driver,
          infuraMocks,
          accountsApiBalancesMock,
          20000,
        );
      },
    );
  });
});
