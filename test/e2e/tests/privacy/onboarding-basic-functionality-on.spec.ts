/**
 * Verifies the network calls made when onboarding with basic functionality on
 * (default settings).
 *
 * 1. Before clicking "Done": every host must be in the `duringOnboarding` list
 *    of onboarding-allowlist.json, and in particular no Infura or token price
 *    requests are made.
 * 2. After clicking "Done": balances (Infura or Accounts API) and token prices
 *    are fetched. When importing a wallet, the stalelist and token
 *    metadata APIs are fetched as well.
 */
import { strict as assert } from 'assert';
import { Mockttp, MockedEndpoint } from 'mockttp';
import { withFixtures, regularDelayMs } from '../../helpers';
import { getWellKnownTokenAssetMetadata } from '../../mock-e2e';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { NETWORK_CLIENT_ID } from '../../constants';
import HomePage from '../../page-objects/pages/home/homepage';
import OnboardingCompletePage from '../../page-objects/pages/onboarding/onboarding-complete-page';
import {
  importSRPOnboardingFlow,
  createNewWalletOnboardingFlow,
  handleSidepanelPostOnboarding,
} from '../../page-objects/flows/onboarding.flow';
import { Driver } from '../../webdriver/driver';
import { METAMASK_STALELIST_URL } from '../phishing-controller/helpers';
import {
  OnboardingPrivacyMocks,
  assertNoInfuraRequestsBeforeOnboarding,
  mockOnboardingInfuraPrivacy,
  splitOnboardingPrivacyMocks,
  waitForPostOnboardingNetworkActivity,
} from './onboarding-infura-privacy-mocks';
import {
  assertOnlyOnboardingAllowlistedHosts,
  recordRequestedHosts,
} from './helpers';

const POST_ONBOARDING_ACTIVITY_TIMEOUT_MS = 20000;

type BasicFunctionalityOnMocks = OnboardingPrivacyMocks & {
  tokenPriceMock: MockedEndpoint;
  importedWalletMocks: MockedEndpoint[];
};

async function mockApis(mockServer: Mockttp): Promise<MockedEndpoint[]> {
  const tokenPriceMock = await mockServer
    .forGet('https://price.api.cx.metamask.io/v3/spot-prices')
    .always()
    .thenCallback(() => ({
      statusCode: 200,
      json: {},
    }));
  const stalelistMock = await mockServer
    .forGet(METAMASK_STALELIST_URL)
    .always()
    .thenCallback(() => ({
      statusCode: 200,
      json: [{ fakedata: true }],
    }));
  const tokenMetadataMock = await mockServer
    .forGet('https://tokens.api.cx.metamask.io/v3/assets')
    .always()
    .thenCallback((request) => ({
      statusCode: 200,
      json: getWellKnownTokenAssetMetadata(
        new URL(request.url).searchParams.getAll('assetIds').join(','),
      ),
    }));
  return [
    tokenPriceMock,
    stalelistMock,
    tokenMetadataMock,
    ...(await mockOnboardingInfuraPrivacy(mockServer)),
  ];
}

function splitMocks(
  mockedEndpoints: MockedEndpoint[],
): BasicFunctionalityOnMocks {
  const [tokenPriceMock, stalelistMock, tokenMetadataMock, ...rest] =
    mockedEndpoints;
  return {
    tokenPriceMock,
    importedWalletMocks: [stalelistMock, tokenMetadataMock],
    ...splitOnboardingPrivacyMocks(rest),
  };
}

async function assertNoNetworkActivityBeforeOnboardingCompleted(
  requestedHosts: Set<string>,
  { tokenPriceMock, infuraMocks }: BasicFunctionalityOnMocks,
): Promise<void> {
  await assertOnlyOnboardingAllowlistedHosts(requestedHosts);
  await assertNoInfuraRequestsBeforeOnboarding(infuraMocks);
  assert.equal(
    (await tokenPriceMock.getSeenRequests()).length,
    0,
    'Token price API should make no requests before onboarding is completed',
  );
}

async function waitForRequests(
  driver: Driver,
  mockedEndpoints: MockedEndpoint[],
): Promise<void> {
  for (const mockedEndpoint of mockedEndpoints) {
    await driver.wait(
      async () => (await mockedEndpoint.getSeenRequests()).length > 0,
      POST_ONBOARDING_ACTIVITY_TIMEOUT_MS,
    );
  }
}

async function waitForNetworkActivityAfterOnboarding(
  driver: Driver,
  {
    tokenPriceMock,
    infuraMocks,
    accountsApiBalancesMock,
  }: BasicFunctionalityOnMocks,
): Promise<void> {
  await waitForPostOnboardingNetworkActivity(
    driver,
    infuraMocks,
    accountsApiBalancesMock,
    POST_ONBOARDING_ACTIVITY_TIMEOUT_MS,
  );
  await waitForRequests(driver, [tokenPriceMock]);
}

describe('Onboarding with basic functionality on', function () {
  const fixtures = new FixtureBuilderV2({ onboarding: true })
    .withSelectedNetwork(NETWORK_CLIENT_ID.MAINNET)
    .withEnabledNetworks({
      eip155: {
        '0x1': true,
      },
    })
    .build();

  it('only makes allowlisted network calls before create new wallet onboarding is completed', async function () {
    await withFixtures(
      {
        fixtures,
        title: this.test?.fullTitle(),
        testSpecificMock: mockApis,
      },
      async ({ driver, mockServer, mockedEndpoint: mockedEndpoints }) => {
        const mocks = splitMocks(mockedEndpoints);
        const requestedHosts = recordRequestedHosts(mockServer);

        await createNewWalletOnboardingFlow({ driver });

        // Intended delay to ensure we cover at least 1 polling loop of time for the network request
        await driver.delay(regularDelayMs);
        await assertNoNetworkActivityBeforeOnboardingCompleted(
          requestedHosts,
          mocks,
        );

        const onboardingCompletePage = new OnboardingCompletePage(driver);
        await onboardingCompletePage.checkPageIsLoaded();
        await onboardingCompletePage.completeOnboarding();

        // Handle sidepanel navigation if needed
        await handleSidepanelPostOnboarding(driver);

        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();

        await waitForNetworkActivityAfterOnboarding(driver, mocks);
      },
    );
  });

  it('only makes allowlisted network calls before import wallet onboarding is completed', async function () {
    await withFixtures(
      {
        fixtures,
        title: this.test?.fullTitle(),
        testSpecificMock: mockApis,
      },
      async ({ driver, mockServer, mockedEndpoint: mockedEndpoints }) => {
        const mocks = splitMocks(mockedEndpoints);
        const requestedHosts = recordRequestedHosts(mockServer);

        await importSRPOnboardingFlow({ driver });

        // Intended delay to ensure we cover at least 1 polling loop of time for the network request
        await driver.delay(regularDelayMs);
        await assertNoNetworkActivityBeforeOnboardingCompleted(
          requestedHosts,
          mocks,
        );

        const onboardingCompletePage = new OnboardingCompletePage(driver);
        await onboardingCompletePage.checkPageIsLoaded();
        await onboardingCompletePage.completeOnboarding();

        // Handle sidepanel navigation if needed
        await handleSidepanelPostOnboarding(driver);

        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();

        await waitForNetworkActivityAfterOnboarding(driver, mocks);
        await waitForRequests(driver, mocks.importedWalletMocks);
      },
    );
  });
});
