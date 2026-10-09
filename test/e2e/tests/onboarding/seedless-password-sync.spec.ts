import { Mockttp } from 'mockttp';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import {
  createSeedlessPasswordKeySyncPendingState,
  createSeedlessLocalPasswordPendingState,
} from '../../fixtures/seedless-password-recovery-fixture';
import { withFixtures } from '../../helpers';
import { MOCK_GOOGLE_ACCOUNT, WALLET_PASSWORD } from '../../constants';
import { FirstTimeFlowType } from '../../../../shared/constants/onboarding';
import HomePage from '../../page-objects/pages/home/homepage';
import { Driver } from '../../webdriver/driver';
import { OAuthMockttpService } from '../../helpers/seedless-onboarding/mocks';
import { importWalletWithSocialLoginOnboardingFlow } from '../../page-objects/flows/onboarding.flow';
import { navigateToSecurityAndPassword } from '../../page-objects/flows/settings.flow';
import ChangePasswordPage from '../../page-objects/pages/settings/change-password-page';
import PrivacySettings from '../../page-objects/pages/settings/privacy-settings';
import LoginPage from '../../page-objects/pages/onboarding/login-page';
import { lockAndWaitForLoginPage } from '../../page-objects/flows/login.flow';
import { SeedlessGlobalPassword } from '../../helpers/seedless-onboarding/data';

const OLD_PASSWORD = WALLET_PASSWORD;
const NEW_PASSWORD = SeedlessGlobalPassword;

describe('Seedless Onboarding (Social Login) password sync and recovery', function () {
  it('should lock the wallet on password change failure and unlock with the old password', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2({ onboarding: true })
          .withShowNativeTokenAsMainBalanceEnabled()
          .withEnabledNetworks({ eip155: { '0x1': true } })
          .build(),
        title: this.test?.fullTitle(),
        testSpecificMock: async (server: Mockttp) => {
          // using this to mock the OAuth Service (Web Authentication flow + Auth server)
          const oAuthMockttpService = new OAuthMockttpService();
          await oAuthMockttpService.setup(server, {
            userEmail: MOCK_GOOGLE_ACCOUNT,
            failStoreKeyShareRequest: true,
          });
        },
        ignoredConsoleErrors: [
          'SeedlessOnboardingController - Failed to change password',
        ],
      },
      async ({ driver }: { driver: Driver }) => {
        await importWalletWithSocialLoginOnboardingFlow({
          driver,
        });

        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();
        await homePage.waitForNonEvmAccountsLoaded();

        await navigateToSecurityAndPassword(driver);

        const privacySettings = new PrivacySettings(driver);
        await privacySettings.openChangePassword();

        const changePasswordPage = new ChangePasswordPage(driver);
        await changePasswordPage.checkPageIsLoaded();

        await changePasswordPage.confirmCurrentPassword(OLD_PASSWORD);

        await changePasswordPage.changePassword(NEW_PASSWORD);

        await changePasswordPage.checkPasswordChangedWarning();
        await changePasswordPage.confirmChangePasswordWarning();

        const loginPage = new LoginPage(driver);
        await loginPage.checkPageIsLoaded();

        await loginPage.loginToHomepage(OLD_PASSWORD);

        // after unlock, the password change page should be loaded again
        // as this is the last page that was loaded before the lock was applied
        await changePasswordPage.checkPageIsLoaded();
      },
    );
  });

  it('should sync the latest global password and unlock with the new password', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2({ onboarding: true })
          .withShowNativeTokenAsMainBalanceEnabled()
          .withEnabledNetworks({ eip155: { '0x1': true } })
          .build(),
        title: this.test?.fullTitle(),
        testSpecificMock: async (server: Mockttp) => {
          // using this to mock the OAuth Service (Web Authentication flow + Auth server)
          const oAuthMockttpService = new OAuthMockttpService();
          await oAuthMockttpService.setup(server, {
            userEmail: MOCK_GOOGLE_ACCOUNT,
            simulatePasswordSync: true,
          });
        },
      },
      async ({ driver }: { driver: Driver }) => {
        await importWalletWithSocialLoginOnboardingFlow({
          driver,
        });

        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();
        await homePage.waitForNonEvmAccountsLoaded();

        await lockAndWaitForLoginPage(driver);
        const loginPage = new LoginPage(driver);

        // The mock reports that another device updated the password.
        // Sync the latest global password to the local wallet.
        await loginPage.loginToHomepage(NEW_PASSWORD);
        await homePage.checkPageIsLoaded();
        await homePage.waitForNonEvmAccountsLoaded();
      },
    );
  });

  it('should recover the password change failure with, `LOCAL_PASSWORD_PENDING` and unlock the wallet', async function () {
    const fixtureBuilder = new FixtureBuilderV2()
      .withShowNativeTokenAsMainBalanceEnabled()
      .withEnabledNetworks({ eip155: { '0x1': true } })
      .withOnboardingController({
        completedOnboarding: true,
        firstTimeFlowType: FirstTimeFlowType.socialCreate,
      })
      .withPreferencesController({
        preferences: {
          hasLinkedSocialLoginProfile: true,
        },
      });
    const keyringVault = (
      fixtureBuilder.build().data.KeyringController as { vault: string }
    ).vault;
    const { state, authPubKey } =
      await createSeedlessLocalPasswordPendingState({
        keyringVault,
        userEmail: MOCK_GOOGLE_ACCOUNT,
      });
    fixtureBuilder.withSeedlessOnboardingController(state);

    await withFixtures(
      {
        fixtures: fixtureBuilder.build(),
        title: this.test?.fullTitle(),
        testSpecificMock: async (server: Mockttp) => {
          // using this to mock the OAuth Service (Web Authentication flow + Auth server)
          const oAuthMockttpService = new OAuthMockttpService();
          await oAuthMockttpService.setup(server, {
            userEmail: MOCK_GOOGLE_ACCOUNT,
            initialAuthPubKey: authPubKey,
          });
        },
      },
      async ({ driver }: { driver: Driver }) => {
        await driver.navigate();

        const loginPage = new LoginPage(driver);
        await loginPage.checkPageIsLoaded();
        await loginPage.loginToHomepage(NEW_PASSWORD);

        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();
        await homePage.waitForNonEvmAccountsLoaded();

        // The first unlock should complete the pending password-change
        // lifecycle. A second unlock verifies the wallet now uses the new
        // password normally.
        await lockAndWaitForLoginPage(driver);
        await loginPage.loginToHomepage(NEW_PASSWORD);
        await homePage.checkPageIsLoaded();
        await homePage.waitForNonEvmAccountsLoaded();
      },
    );
  });

  it('should recover the password change failure with `KEY_SYNC_PENDING` and unlock the wallet', async function () {
    const fixtureBuilder = new FixtureBuilderV2()
      .withShowNativeTokenAsMainBalanceEnabled()
      .withEnabledNetworks({ eip155: { '0x1': true } })
      .withOnboardingController({
        completedOnboarding: true,
        firstTimeFlowType: FirstTimeFlowType.socialCreate,
      })
      .withPreferencesController({
        preferences: {
          hasLinkedSocialLoginProfile: true,
        },
      });
    const originalKeyringVault = (
      fixtureBuilder.build().data.KeyringController as { vault: string }
    ).vault;
    const {
      state,
      authPubKey,
      keyringVault: updatedKeyringVault,
    } = await createSeedlessPasswordKeySyncPendingState({
      keyringVault: originalKeyringVault,
      userEmail: MOCK_GOOGLE_ACCOUNT,
    });
    fixtureBuilder
      .withKeyringController({ vault: updatedKeyringVault })
      .withSeedlessOnboardingController(state);

    await withFixtures(
      {
        fixtures: fixtureBuilder.build(),
        title: this.test?.fullTitle(),
        testSpecificMock: async (server: Mockttp) => {
          // Use the same auth public key as the persisted Seedless vault so
          // recovery can unlock the mocked password-sync data.
          const oAuthMockttpService = new OAuthMockttpService();
          await oAuthMockttpService.setup(server, {
            userEmail: MOCK_GOOGLE_ACCOUNT,
            initialAuthPubKey: authPubKey,
          });
        },
      },
      async ({ driver }: { driver: Driver }) => {
        await driver.navigate();

        const loginPage = new LoginPage(driver);
        await loginPage.checkPageIsLoaded();
        await loginPage.loginToHomepage(NEW_PASSWORD);

        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();
        await homePage.waitForNonEvmAccountsLoaded();

        // The first unlock should sync the current Keyring encryption key and
        // complete the pending password-change lifecycle.
        await lockAndWaitForLoginPage(driver);
        await loginPage.loginToHomepage(NEW_PASSWORD);
        await homePage.checkPageIsLoaded();
        await homePage.waitForNonEvmAccountsLoaded();
      },
    );
  });
});
