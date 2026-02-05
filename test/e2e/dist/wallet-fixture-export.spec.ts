import path from 'path';
import fs from 'fs-extra';
import { withFixtures } from '../helpers';
import {
  LOCAL_NODE_MNEMONIC,
  WALLET_PASSWORD,
  WINDOW_TITLES,
} from '../constants';
import StartOnboardingPage from '../page-objects/pages/onboarding/start-onboarding-page';
import {
  computeSchemaDiff,
  hasSchemaDifferences,
  mergeFixtureChanges,
  readFixtureFile,
} from '../fixtures/fixture-validation';
import OnboardingSrpPage from '../page-objects/pages/onboarding/onboarding-srp-page';
import OnboardingPasswordPage from '../page-objects/pages/onboarding/onboarding-password-page';
import OnboardingCompletePage from '../page-objects/pages/onboarding/onboarding-complete-page';
import {
  handleSidepanelPostOnboarding,
  onboardingMetricsFlow,
} from '../page-objects/flows/onboarding.flow';
import HomePage from '../page-objects/pages/home/homepage';
import OnboardingPrivacySettingsPage from '../page-objects/pages/onboarding/onboarding-privacy-settings-page';
import SettingsPage from '../page-objects/pages/settings/settings-page';
import GeneralSettings from '../page-objects/pages/settings/general-settings';
import AdvancedSettings from '../page-objects/pages/settings/advanced-settings';
import { switchToNetworkFromNetworkSelect } from '../page-objects/flows/network.flow';

type JsonLike = Record<string, unknown>;

describe('Wallet State', function () {
  it('export onboarding fixture', async function () {
    await withFixtures(
      {
        disableServerMochaToBackground: true,
        title: this.test?.fullTitle(),
      },
      async ({ driver }) => {
        // we don't need to use navigate since MM will automatically open a new window in prod build
        await driver.waitAndSwitchToWindowWithTitle(
          2,
          WINDOW_TITLES.ExtensionInFullScreenView,
        );
        const startOnboardingPage = new StartOnboardingPage(driver);
        await startOnboardingPage.checkLoginPageIsLoaded();

        // Add hardcoded delay to stabilize the test and ensure values for properties are loaded
        await driver.delay(10000);

        const persistedState = await driver.executeScript(
          'return window.stateHooks.getPersistedState()',
        );

        if (
          persistedState === null ||
          persistedState === undefined ||
          typeof persistedState !== 'object'
        ) {
          throw new Error(
            `Expected getPersistedState() to return an object, but got: ${typeof persistedState}`,
          );
        }

        const validatedState = persistedState as JsonLike;

        const outDir = path.resolve(process.cwd(), 'test', 'e2e', 'fixtures');
        await fs.ensureDir(outDir);
        const outPath = path.join(outDir, 'onboarding-fixture.json');
        console.log(
          '\n=============================================================================\n',
        );
        console.log('📁 WALLET FIXTURE STATE EXPORT');
        console.log(
          '=============================================================================\n',
        );

        // Try to read existing fixture and compute diff
        let finalState: JsonLike;
        try {
          const existingFixture = await readFixtureFile(outPath);
          const schemaDiff = computeSchemaDiff(existingFixture, validatedState);

          if (hasSchemaDifferences(schemaDiff)) {
            console.log('📊 Schema differences detected:');
            if (schemaDiff.newKeys.length > 0) {
              console.log(`  ✨ New keys: ${schemaDiff.newKeys.length}`);
              schemaDiff.newKeys.forEach((key) => console.log(`     + ${key}`));
            }
            if (schemaDiff.missingKeys.length > 0) {
              console.log(
                `  🗑️  Missing keys: ${schemaDiff.missingKeys.length}`,
              );
              schemaDiff.missingKeys.forEach((key) =>
                console.log(`     - ${key}`),
              );
            }
            if (schemaDiff.typeMismatches.length > 0) {
              console.log(
                `  🔄 Type mismatches: ${schemaDiff.typeMismatches.length}`,
              );
              schemaDiff.typeMismatches.forEach((entry) =>
                console.log(`     ~ ${entry}`),
              );
            }
            if (schemaDiff.valueMismatches.length > 0) {
              console.log(
                `  📝 Value changes: ${schemaDiff.valueMismatches.length}`,
              );
              schemaDiff.valueMismatches.forEach((entry) =>
                console.log(`     ↔ ${entry}`),
              );
            }

            // Merge only the changes into the existing fixture
            finalState = mergeFixtureChanges(
              existingFixture,
              validatedState,
              schemaDiff,
            );
            console.log(
              '\n✅ Merged changes into existing fixture (preserving ignored keys)',
            );
          } else {
            console.log(
              '✅ No schema differences detected - fixture is up to date',
            );
            finalState = existingFixture;
          }
        } catch (error) {
          console.error('❌ Failed to read existing fixture file:', error);
          throw error;
        }

        console.log(`\n📂 Output: ${outPath}`);
        console.log(
          '\n=============================================================================\n',
        );

        await fs.writeJson(outPath, finalState, { spaces: 2 });
      },
    );
  });
  it('export default fixture', async function () {
    const networkName = 'Localhost 8545';
    const networkUrl = 'http://127.0.0.1:8545';
    const currencySymbol = 'ETH';
    const chainId = 1337;
    await withFixtures(
      {
        disableServerMochaToBackground: true,
        title: this.test?.fullTitle(),
      },
      async ({ driver }) => {
        // we don't need to use navigate since MM will automatically open a new window in prod build
        await driver.waitAndSwitchToWindowWithTitle(
          2,
          WINDOW_TITLES.ExtensionInFullScreenView,
        );

        // Perform the onboarding manual steps with e2e SRP and password to generate the logged in state
        const startOnboardingPage = new StartOnboardingPage(driver);
        await startOnboardingPage.importWallet();

        const onboardingSrpPage = new OnboardingSrpPage(driver);
        await onboardingSrpPage.checkPageIsLoaded();
        await onboardingSrpPage.fillSrp(LOCAL_NODE_MNEMONIC);
        await onboardingSrpPage.clickConfirmButton();

        const onboardingPasswordPage = new OnboardingPasswordPage(driver);
        await onboardingPasswordPage.checkPageIsLoaded();
        await onboardingPasswordPage.createWalletPassword(WALLET_PASSWORD);

        await onboardingMetricsFlow(driver, {
          participateInMetaMetrics: true,
          dataCollectionForMarketing: true,
        });

        const onboardingCompletePage = new OnboardingCompletePage(driver);
        await onboardingCompletePage.checkPageIsLoaded();
        await onboardingCompletePage.checkWalletReadyMessageIsDisplayed();
        await onboardingCompletePage.navigateToDefaultPrivacySettings();

        const onboardingPrivacySettingsPage = new OnboardingPrivacySettingsPage(
          driver,
        );

        await onboardingPrivacySettingsPage.addCustomNetwork(
          networkName,
          chainId,
          currencySymbol,
          networkUrl,
        );

        await onboardingPrivacySettingsPage.navigateBackToOnboardingCompletePage();

        await onboardingCompletePage.checkPageIsLoaded();
        await onboardingCompletePage.completeOnboarding();

        // Handle sidepanel navigation if needed
        await handleSidepanelPostOnboarding(driver);

        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();
        await homePage.headerNavbar.openSettingsPage();

        // Set the settings to match the desired fixture state:
        // 1. enabled test networks and 2. enabled native balance
        const generalSettings = new GeneralSettings(driver);
        await generalSettings.checkPageIsLoaded();
        await generalSettings.toggleShowNativeTokenAsMainBalance();

        const settingsPage = new SettingsPage(driver);
        await settingsPage.clickAdvancedTab();

        const advancedSettings = new AdvancedSettings(driver);
        await advancedSettings.checkPageIsLoaded();
        await advancedSettings.toggleShowTestnets();
        await settingsPage.closeSettingsPage();

        // Action needed to apply the changes in the balance as doesn't happen right away (potential bug)
        await switchToNetworkFromNetworkSelect(
          driver,
          'Popular',
          'All popular networks',
        );

        await switchToNetworkFromNetworkSelect(
          driver,
          'Custom',
          'Localhost 8545',
        );

        // Fiat value should be displayed as we mock the price and that is not a 'test network'
        await homePage.checkExpectedBalanceIsDisplayed('25', 'ETH');

        // Add hardcoded delay to stabilize the test and ensure values for properties are loaded
        await driver.delay(10000);

        const persistedState = await driver.executeScript(
          'return window.stateHooks.getPersistedState()',
        );

        if (
          persistedState === null ||
          persistedState === undefined ||
          typeof persistedState !== 'object'
        ) {
          throw new Error(
            `Expected getPersistedState() to return an object, but got: ${typeof persistedState}`,
          );
        }

        const validatedState = persistedState as JsonLike;

        const outDir = path.resolve(process.cwd(), 'test', 'e2e', 'fixtures');
        await fs.ensureDir(outDir);
        const outPath = path.join(outDir, 'default-fixture.json');
        console.log(
          '\n=============================================================================\n',
        );
        console.log('📁 WALLET FIXTURE STATE EXPORT');
        console.log(
          '=============================================================================\n',
        );

        // Try to read existing fixture and compute diff
        let finalState: JsonLike;
        try {
          const existingFixture = await readFixtureFile(outPath);
          const schemaDiff = computeSchemaDiff(existingFixture, validatedState);

          if (hasSchemaDifferences(schemaDiff)) {
            console.log('📊 Schema differences detected:');
            if (schemaDiff.newKeys.length > 0) {
              console.log(`  ✨ New keys: ${schemaDiff.newKeys.length}`);
              schemaDiff.newKeys.forEach((key) => console.log(`     + ${key}`));
            }
            if (schemaDiff.missingKeys.length > 0) {
              console.log(
                `  🗑️  Missing keys: ${schemaDiff.missingKeys.length}`,
              );
              schemaDiff.missingKeys.forEach((key) =>
                console.log(`     - ${key}`),
              );
            }
            if (schemaDiff.typeMismatches.length > 0) {
              console.log(
                `  🔄 Type mismatches: ${schemaDiff.typeMismatches.length}`,
              );
              schemaDiff.typeMismatches.forEach((entry) =>
                console.log(`     ~ ${entry}`),
              );
            }
            if (schemaDiff.valueMismatches.length > 0) {
              console.log(
                `  📝 Value changes: ${schemaDiff.valueMismatches.length}`,
              );
              schemaDiff.valueMismatches.forEach((entry) =>
                console.log(`     ↔ ${entry}`),
              );
            }

            // Merge only the changes into the existing fixture
            finalState = mergeFixtureChanges(
              existingFixture,
              validatedState,
              schemaDiff,
            );
            console.log(
              '\n✅ Merged changes into existing fixture (preserving ignored keys)',
            );
          } else {
            console.log(
              '✅ No schema differences detected - fixture is up to date',
            );
            finalState = existingFixture;
          }
        } catch (error) {
          console.error('❌ Failed to read existing fixture file:', error);
          throw error;
        }

        console.log(`\n📂 Output: ${outPath}`);
        console.log(
          '\n=============================================================================\n',
        );

        await fs.writeJson(outPath, finalState, { spaces: 2 });
      },
    );
  });
});
