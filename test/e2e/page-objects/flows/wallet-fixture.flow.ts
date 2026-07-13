import { Driver } from '../../webdriver/driver';
import { E2E_SRP, WALLET_PASSWORD, WINDOW_TITLES } from '../../constants';
import StartOnboardingPage from '../pages/onboarding/start-onboarding-page';
import HomePage from '../pages/home/homepage';
import {
  addCustomNetworkInOnboardingPrivacySettings,
  handleSidepanelPostOnboarding,
  importSRPOnboardingFlow,
} from './onboarding.flow';
import {
  enableNativeTokenAsMainBalance,
  enableTestNetworks,
} from './settings.flow';
import { switchToNetworkFromNetworkSelect } from './network.flow';

/**
 * A JSON-like object type for representing persisted wallet state.
 */
type JsonLike = Record<string, unknown>;

/**
 * Hardcoded delay used to let asynchronous controller state settle before we
 * read the persisted state.
 */
const STATE_SETTLE_DELAY_MS = 10000;

const LOCALHOST_NETWORK = {
  networkName: 'Localhost 8545',
  networkUrl: 'http://localhost:8545',
  currencySymbol: 'ETH',
  chainId: 1337,
};

/**
 * Reads the persisted extension state, waiting briefly first so asynchronous
 * controller values have time to settle.
 *
 * @param driver - The WebDriver instance.
 * @returns The persisted state object.
 * @throws If `getPersistedState()` does not return an object.
 */
const getPersistedState = async (driver: Driver): Promise<JsonLike> => {
  // Add hardcoded delay to stabilize the test and ensure values for properties are loaded
  await driver.delay(STATE_SETTLE_DELAY_MS);

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

  return persistedState as JsonLike;
};

/**
 * Drives the extension into the state captured by `onboarding-fixture.json`
 * (a fresh install sitting on the login/start-onboarding screen) and returns
 * the persisted state.
 *
 * @param driver - The WebDriver instance.
 * @returns The persisted state for the onboarding fixture.
 */
export const generateOnboardingFixtureState = async (
  driver: Driver,
): Promise<JsonLike> => {
  // we don't need to use navigate since MM will automatically open a new window in prod build
  await driver.waitAndSwitchToWindowWithTitle(
    2,
    WINDOW_TITLES.ExtensionInFullScreenView,
  );
  const startOnboardingPage = new StartOnboardingPage(driver);
  await startOnboardingPage.checkLoginPageIsLoaded();

  return getPersistedState(driver);
};

/**
 * Drives the extension into the state captured by `default-fixture.json` (an
 * imported wallet with a custom localhost network, native token as main
 * balance, and test networks enabled) and returns the persisted state.
 *
 * @param driver - The WebDriver instance.
 * @returns The persisted state for the default fixture.
 */
export const generateDefaultFixtureState = async (
  driver: Driver,
): Promise<JsonLike> => {
  const { networkName, networkUrl, currencySymbol, chainId } =
    LOCALHOST_NETWORK;

  // we don't need to use navigate since MM will automatically open a new window in prod build
  await driver.waitAndSwitchToWindowWithTitle(
    2,
    WINDOW_TITLES.ExtensionInFullScreenView,
  );

  // Perform the onboarding manual steps with e2e SRP and password to generate the logged in state
  await importSRPOnboardingFlow({
    driver,
    seedPhrase: E2E_SRP,
    password: WALLET_PASSWORD,
    completedMetaMetricsOnboarding: true,
    optedIn: false,
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

  // Headless Chrome defaults to 800×600 which is too short for the
  // settings-v2 content pane — the native-balance toggle is below the
  // fold and waitForSelector's visibility check times out.  Resize to
  // a height that keeps the toggle visible without scrolling.
  await driver.driver.manage().window().setRect({
    width: 1280,
    height: 960,
  });

  // Set the settings to match the desired fixture state:
  // 1. enabled native balance and 2. enabled test networks
  await enableNativeTokenAsMainBalance(driver);

  // Action needed to apply the changes in the balance as doesn't happen right away (potential bug)
  await switchToNetworkFromNetworkSelect(
    driver,
    'Popular',
    'All popular networks',
  );

  await enableTestNetworks(driver);

  await switchToNetworkFromNetworkSelect(driver, 'Custom', 'Localhost 8545');

  // Fiat value should be displayed as we mock the price and that is not a 'test network'
  await homePage.checkExpectedBalanceIsDisplayed('25', 'ETH');

  return getPersistedState(driver);
};
