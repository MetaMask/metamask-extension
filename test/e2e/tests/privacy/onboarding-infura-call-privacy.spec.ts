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
import {
  assertNoInfuraRequestsBeforeOnboarding,
  mockOnboardingInfuraPrivacy,
  splitOnboardingPrivacyMocks,
  waitForPostOnboardingNetworkActivity,
} from './onboarding-infura-privacy-mocks';

describe('MetaMask onboarding', function () {
  it("doesn't make any network requests to infura before create new wallet onboarding is completed", async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2({ onboarding: true })
          .withSelectedNetwork(NETWORK_CLIENT_ID.MAINNET)
          .build(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockOnboardingInfuraPrivacy,
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
        testSpecificMock: mockOnboardingInfuraPrivacy,
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
