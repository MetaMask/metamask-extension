import path from 'path';
import { withFixtures } from '../helpers';
import {
  LOCAL_NODE_MNEMONIC,
  WALLET_PASSWORD,
  WINDOW_TITLES,
} from '../constants';
import StartOnboardingPage from '../page-objects/pages/onboarding/start-onboarding-page';
import {
  computeSchemaDiff,
  formatSchemaDiff,
  hasSchemaDifferences,
  readFixtureFile,
} from '../fixtures/fixture-validation';
import {
  addCustomNetworkInOnboardingPrivacySettings,
  handleSidepanelPostOnboarding,
  importSRPOnboardingFlow,
} from '../page-objects/flows/onboarding.flow';
import {
  enableNativeTokenAsMainBalance,
  enableTestNetworks,
} from '../page-objects/flows/settings.flow';
import HomePage from '../page-objects/pages/home/homepage';
import { switchToNetworkFromNetworkSelect } from '../page-objects/flows/network.flow';

const ONBOARDING_FIXTURE_PATH = path.resolve(
  __dirname,
  '../fixtures',
  'onboarding-fixture.json',
);

const DEFAULT_FIXTURE_PATH = path.resolve(
  __dirname,
  '../fixtures',
  'default-fixture.json',
);

describe('Wallet State', function () {
  it('matches the committed onboarding fixture schema', async function () {
    // Skip on Firefox - this.skip() throws immediately and prevents withFixtures() from running
    if (process.env.SELENIUM_BROWSER === 'firefox') {
      this.skip();
    }

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

        const validatedState = persistedState as Record<string, unknown>;

        const existingFixture = await readFixtureFile(ONBOARDING_FIXTURE_PATH);
        const schemaDiff = computeSchemaDiff(existingFixture, validatedState);

        if (hasSchemaDifferences(schemaDiff)) {
          const message = formatSchemaDiff(schemaDiff);
          console.log(
            '\n=============================================================================\n',
          );
          console.log('⚠️  WALLET FIXTURE STATE VALIDATION FAILED');
          console.log(
            '=============================================================================\n',
          );
          console.log(
            '🤖 Automatic update: comment @metamaskbot update-e2e-fixture',
          );
          console.log(
            '\n🛠️  Manual update steps:\n  yarn dist\n  yarn test:e2e:single test/e2e/dist/wallet-fixture-export.spec.ts --browser chrome',
          );
          console.log(
            '\n=============================================================================\n',
          );
          throw new Error(message);
        }
      },
    );
  });

  it('matches the committed default fixture schema', async function () {
    // Skip on Firefox - this.skip() throws immediately and prevents withFixtures() from running
    if (process.env.SELENIUM_BROWSER === 'firefox') {
      this.skip();
    }

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
        await importSRPOnboardingFlow({
          driver,
          seedPhrase: LOCAL_NODE_MNEMONIC,
          password: WALLET_PASSWORD,
          participateInMetaMetrics: true,
          dataCollectionForMarketing: true,
          needNavigateToNewPage: false,
        });

        // Add custom network during onboarding privacy settings
        await addCustomNetworkInOnboardingPrivacySettings({
          driver,
          networkName,
          chainId,
          currencySymbol,
          networkUrl,
        });

        // Handle sidepanel navigation if needed
        await handleSidepanelPostOnboarding(driver);

        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();

        // Set the settings to match the desired fixture state:
        // 1. enabled native balance and 2. enabled test networks
        await enableNativeTokenAsMainBalance(driver);
        await enableTestNetworks(driver);

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

        const validatedState = persistedState as Record<string, unknown>;

        const existingFixture = await readFixtureFile(DEFAULT_FIXTURE_PATH);
        const schemaDiff = computeSchemaDiff(existingFixture, validatedState);

        if (hasSchemaDifferences(schemaDiff)) {
          const message = formatSchemaDiff(schemaDiff);
          console.log(
            '\n=============================================================================\n',
          );
          console.log('⚠️  WALLET FIXTURE STATE VALIDATION FAILED');
          console.log(
            '=============================================================================\n',
          );
          console.log(
            '🤖 Automatic update: comment @metamaskbot update-e2e-fixture',
          );
          console.log(
            '\n🛠️  Manual update steps:\n  yarn dist\n  yarn test:e2e:single test/e2e/dist/wallet-fixture-export.spec.ts --browser chrome',
          );
          console.log(
            '\n=============================================================================\n',
          );
          throw new Error(message);
        }
      },
    );
  });
});
