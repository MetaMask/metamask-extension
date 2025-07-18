import { strict as assert } from 'assert';
import { Mockttp } from 'mockttp';
import FixtureBuilder from '../../fixture-builder';
import { withFixtures } from '../../helpers';
import { Driver } from '../../webdriver/driver';
import { OAuthMockttpService } from '../../helpers/seedless-onboarding/mocks';
import {
  createNewWalletWithSocialLoginOnboardingFlow,
  importWalletWithSocialLoginOnboardingFlow,
} from '../../page-objects/flows/onboarding.flow';
import OnboardingCompletePage from '../../page-objects/pages/onboarding/onboarding-complete-page';
import HomePage from '../../page-objects/pages/home/homepage';
import {
  MOCK_GOOGLE_ACCOUNT,
  MOCK_GOOGLE_ACCOUNT_WALLET_ADDRESS,
} from '../../constants';
import { shortenAddress } from '../../../../ui/helpers/utils/util';
import { normalizeSafeAddress } from '../../../../app/scripts/lib/multichain/address';

describe('Metamask onboarding (with social login)', function () {
  it('Creates a new wallet with Google login and completes the onboarding process', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder({ onboarding: true }).build(),
        title: this.test?.fullTitle(),
        testSpecificMock: (server: Mockttp) => {
          // using this to mock the OAuth Service (Web Authentication flow + Auth server)
          const oAuthMockttpService = new OAuthMockttpService();
          return oAuthMockttpService.setup(server);
        },
      },
      async ({ driver }: { driver: Driver }) => {
        await createNewWalletWithSocialLoginOnboardingFlow({
          driver,
        });

        const onboardingCompletePage = new OnboardingCompletePage(driver);
        await onboardingCompletePage.check_pageIsLoaded();
        await onboardingCompletePage.check_walletReadyMessageIsDisplayed();
        await onboardingCompletePage.completeOnboarding();

        const homePage = new HomePage(driver);
        await homePage.check_pageIsLoaded();
        await homePage.check_expectedBalanceIsDisplayed('0');
      },
    );
  });

  it('Imports an existing wallet with Google login and completes the onboarding process', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder({ onboarding: true }).build(),
        title: this.test?.fullTitle(),
        testSpecificMock: (server: Mockttp) => {
          // using this to mock the OAuth Service (Web Authentication flow + Auth server)
          const oAuthMockttpService = new OAuthMockttpService();
          return oAuthMockttpService.setup(server, {
            userEmail: MOCK_GOOGLE_ACCOUNT,
          });
        },
      },
      async ({ driver }: { driver: Driver }) => {
        await importWalletWithSocialLoginOnboardingFlow({
          driver,
        });

        const onboardingCompletePage = new OnboardingCompletePage(driver);
        const isSocialImportFlow = true;
        await onboardingCompletePage.completeOnboarding(isSocialImportFlow);

        const homePage = new HomePage(driver);
        await homePage.check_pageIsLoaded();
        const displayedWalletAddress = await homePage.getAccountAddress();

        assert.deepStrictEqual(
          displayedWalletAddress,
          shortenAddress(
            normalizeSafeAddress(MOCK_GOOGLE_ACCOUNT_WALLET_ADDRESS),
          ),
        );
      },
    );
  });
});
