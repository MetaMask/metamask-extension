import assert from 'assert';
import { Mockttp, MockedEndpoint } from 'mockttp';
import { withFixtures, regularDelayMs } from '../../helpers';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { NETWORK_CLIENT_ID } from '../../constants';
import HomePage from '../../page-objects/pages/home/homepage';
import OnboardingCompletePage from '../../page-objects/pages/onboarding/onboarding-complete-page';
import {
  importSRPOnboardingFlow,
  createNewWalletOnboardingFlow,
  handleSidepanelPostOnboarding,
} from '../../page-objects/flows/onboarding.flow';
import { ACCOUNTS_PROD_API_BASE_URL } from '../../../../shared/constants/accounts';
import { Driver } from '../../webdriver/driver';

const INFURA_URL =
  'https://mainnet.infura.io/v3/00000000000000000000000000000000';
const SAMPLE_ADDRESS = '1111111111111111111111111111111111111111';

type OnboardingInfuraMocks = {
  infuraEndpoints: MockedEndpoint[];
  ethBlockNumberEndpoint: MockedEndpoint;
  ethGetBalanceEndpoint: MockedEndpoint;
  accountsApiBalancesEndpoint: MockedEndpoint;
};

// Mock function implementation for Infura requests
async function mockInfura(mockServer: Mockttp): Promise<OnboardingInfuraMocks> {
  const ethBlockNumberEndpoint = await mockServer
    .forPost(INFURA_URL)
    .withJsonBodyIncluding({ method: 'eth_blockNumber' })
    .always()
    .thenCallback(() => ({
      statusCode: 200,
      json: {
        jsonrpc: '2.0',
        id: '1111111111111111',
        result: '0x1',
      },
    }));

  const ethGetBalanceEndpoint = await mockServer
    .forPost(INFURA_URL)
    .withJsonBodyIncluding({ method: 'eth_getBalance' })
    .always()
    .thenCallback(() => ({
      statusCode: 200,
      json: {
        jsonrpc: '2.0',
        id: '1111111111111111',
        result: '0x0',
      },
    }));

  const infuraEndpoints = [
    ethBlockNumberEndpoint,
    ethGetBalanceEndpoint,
    await mockServer
      .forPost(INFURA_URL)
      .withJsonBodyIncluding({ method: 'eth_getBlockByNumber' })
      .always()
      .thenCallback(() => ({
        statusCode: 200,
        json: {
          jsonrpc: '2.0',
          id: '1111111111111111',
          result: {},
        },
      })),
    await mockServer
      .forPost(INFURA_URL)
      .withJsonBodyIncluding({ method: 'eth_call' })
      .always()
      .thenCallback(() => ({
        statusCode: 200,
        json: {
          jsonrpc: '2.0',
          id: '1111111111111111',
          result: `0x000000000000000000000000${SAMPLE_ADDRESS}`,
        },
      })),
    await mockServer
      .forPost(INFURA_URL)
      .withJsonBodyIncluding({ method: 'net_version' })
      .always()
      .thenCallback(() => ({
        statusCode: 200,
        json: { id: 8262367391254633, jsonrpc: '2.0', result: '1337' },
      })),
  ];

  const accountsApiBalancesEndpoint = await mockServer
    .forGet(`${ACCOUNTS_PROD_API_BASE_URL}/v5/multiaccount/balances`)
    .always()
    .thenCallback(() => ({
      statusCode: 200,
      json: {
        count: 0,
        balances: [],
        unprocessedNetworks: [],
      },
    }));

  return {
    infuraEndpoints,
    ethBlockNumberEndpoint,
    ethGetBalanceEndpoint,
    accountsApiBalancesEndpoint,
  };
}

async function assertNoInfuraBeforeOnboarding(
  infuraEndpoints: MockedEndpoint[],
): Promise<void> {
  for (const [index, mockedEndpoint] of infuraEndpoints.entries()) {
    const requests = await mockedEndpoint.getSeenRequests();
    assert.equal(
      requests.length,
      0,
      `Infura mock ${index} should make no requests before onboarding`,
    );
  }
}

async function assertPostOnboardingNetworkActivity(
  driver: Driver,
  {
    ethBlockNumberEndpoint,
    ethGetBalanceEndpoint,
    accountsApiBalancesEndpoint,
  }: OnboardingInfuraMocks,
): Promise<void> {
  // Network polling still uses Infura after onboarding.
  await driver.wait(async () => {
    return (await ethBlockNumberEndpoint.getSeenRequests()).length > 0;
  }, driver.timeout);

  // With assets unify enabled, native balances come from Accounts API v5, not Infura.
  await driver.wait(async () => {
    return (await accountsApiBalancesEndpoint.getSeenRequests()).length > 0;
  }, driver.timeout);

  assert.equal(
    (await ethGetBalanceEndpoint.getSeenRequests()).length,
    0,
    'eth_getBalance should not use Infura when unified assets is enabled',
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
        testSpecificMock: mockInfura,
      },
      async ({ driver, mockedEndpoint: onboardingMocks }) => {
        const mocks = onboardingMocks as unknown as OnboardingInfuraMocks;

        await createNewWalletOnboardingFlow({ driver });

        // Intended delay to ensure we cover at least 1 polling loop of time for the network request
        await driver.delay(regularDelayMs);
        await assertNoInfuraBeforeOnboarding(mocks.infuraEndpoints);

        const onboardingCompletePage = new OnboardingCompletePage(driver);
        await onboardingCompletePage.checkPageIsLoaded();
        await onboardingCompletePage.completeOnboarding();

        await handleSidepanelPostOnboarding(driver);

        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();

        await assertPostOnboardingNetworkActivity(driver, mocks);
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
        testSpecificMock: mockInfura,
      },
      async ({ driver, mockedEndpoint: onboardingMocks }) => {
        const mocks = onboardingMocks as unknown as OnboardingInfuraMocks;

        await importSRPOnboardingFlow({ driver });

        await driver.delay(regularDelayMs);
        await assertNoInfuraBeforeOnboarding(mocks.infuraEndpoints);

        const onboardingCompletePage = new OnboardingCompletePage(driver);
        await onboardingCompletePage.checkPageIsLoaded();
        await onboardingCompletePage.completeOnboarding();

        await handleSidepanelPostOnboarding(driver);

        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();

        await assertPostOnboardingNetworkActivity(driver, mocks);
      },
    );
  });
});
