/**
 * Where each onboarding step's long-task window opens. The browser, page
 * objects and step timers record to `mockEvents`; the long-task helper is
 * real, so its reset and collect calls are recorded through the driver.
 */

const mockEvents: string[] = [];

/**
 * A page-object module whose instances record every method call.
 *
 * @param name - The page object's name, as recorded.
 */
function mockPageObject(name: string) {
  return {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    __esModule: true,
    default: jest.fn().mockImplementation(
      () =>
        new Proxy(
          {},
          {
            get: (_target, prop) =>
              prop === 'then'
                ? undefined
                : async () => {
                    mockEvents.push(`${name}.${String(prop)}`);
                  },
          },
        ),
    ),
  };
}

jest.mock('selenium-webdriver', () => ({
  Browser: { CHROME: 'chrome', FIREFOX: 'firefox' },
}));
jest.mock('../../../../../app/scripts/fixtures/with-networks', () => ({
  ALL_POPULAR_NETWORKS: {},
}));
jest.mock('../../../fixtures/fixture-builder-v2', () => ({
  // eslint-disable-next-line @typescript-eslint/naming-convention
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    withEnabledNetworks: () => ({ build: () => ({}) }),
  })),
}));
jest.mock('../../../constants', () => ({
  E2E_SRP: 'srp',
  WALLET_PASSWORD: 'password',
}));
jest.mock('../../../webdriver/driver', () => ({}));
jest.mock('../../../helpers', () => ({
  withFixtures: jest.fn(
    async (
      _options: unknown,
      callback: (args: unknown) => Promise<void>,
    ): Promise<void> => {
      await callback({
        driver: new Proxy(
          {},
          {
            get: (_target, prop) => async () => {
              mockEvents.push(`driver.${String(prop)}`);
              return undefined;
            },
          },
        ),
      });
    },
  ),
}));
jest.mock('../../../page-objects/flows/onboarding.flow', () => ({
  handleSidepanelPostOnboarding: jest.fn(async () => {
    mockEvents.push('handleSidepanelPostOnboarding');
  }),
  onboardingMetricsFlow: jest.fn(async () => {
    mockEvents.push('onboardingMetricsFlow');
  }),
  skipPasskeySetup: jest.fn(async () => {
    mockEvents.push('skipPasskeySetup');
  }),
}));
jest.mock('../../../page-objects/pages/accounts/list-page', () =>
  mockPageObject('AccountListPage'),
);
jest.mock('../../../page-objects/pages/home/header-navbar', () =>
  mockPageObject('HeaderNavbar'),
);
jest.mock('../../../page-objects/pages/home/tokens-tab', () =>
  mockPageObject('TokensTab'),
);
jest.mock('../../../page-objects/pages/home/homepage', () =>
  mockPageObject('HomePage'),
);
jest.mock(
  '../../../page-objects/pages/onboarding/onboarding-complete-page',
  () => mockPageObject('OnboardingCompletePage'),
);
jest.mock(
  '../../../page-objects/pages/onboarding/onboarding-metrics-page',
  () => mockPageObject('OnboardingMetricsPage'),
);
jest.mock(
  '../../../page-objects/pages/onboarding/onboarding-password-page',
  () => mockPageObject('OnboardingPasswordPage'),
);
jest.mock('../../../page-objects/pages/onboarding/onboarding-srp-page', () =>
  mockPageObject('OnboardingSrpPage'),
);
jest.mock('../../../page-objects/pages/onboarding/secure-wallet-page', () =>
  mockPageObject('SecureWalletPage'),
);
jest.mock('../../../page-objects/pages/onboarding/start-onboarding-page', () =>
  mockPageObject('StartOnboardingPage'),
);
jest.mock('../../utils/timer-helper', () => ({
  // eslint-disable-next-line @typescript-eslint/naming-convention
  __esModule: true,
  collectTimerResults: jest.fn(() => []),
  default: jest.fn().mockImplementation((id: string) => ({
    id,
    measure: async (action: () => Promise<void>) => {
      mockEvents.push(`timer.start:${id}`);
      await action();
      mockEvents.push(`timer.end:${id}`);
    },
    getDuration: () => 1,
  })),
}));
jest.mock('../../utils/performance-tracker', () => ({
  performanceTracker: { addTimer: jest.fn() },
}));
jest.mock('../../../mock-e2e-pass-through', () => ({
  setPassThroughInterceptor: jest.fn(),
}));
jest.mock('../../mocks/performance-mocks', () => ({
  benchmarkPassThroughInterceptor: jest.fn(),
  getCommonMocks: jest.fn(() => []),
  mockBenchmarkEndpoints: jest.fn(),
  userStorageHostMock: jest.fn(),
}));
jest.mock('../../utils/mock-config', () => ({
  getTestSpecificMock: jest.fn(() => jest.fn()),
  shouldUseMockedRequests: jest.fn(() => true),
}));
jest.mock('../../utils', () => ({
  collectWebVitals: jest.fn(async () => undefined),
}));

// Imported after the mocks above, which jest hoists over it.
// eslint-disable-next-line import-x/first
import { run as runImportWallet } from './onboarding-import-wallet';
// eslint-disable-next-line import-x/first
import { run as runNewWallet } from './onboarding-new-wallet';

/**
 * Where an event was recorded; fails the test when it was not.
 *
 * @returns Its index in `mockEvents`.
 */
function at(event: string): number {
  const index = mockEvents.indexOf(event);
  if (index === -1) {
    throw new Error(`"${event}" was not recorded: ${mockEvents.join(', ')}`);
  }
  return index;
}

/**
 * A step's long-task window, as `mockEvents` indexes: the last reset before
 * the timer named `stepId` starts, the start, and the first collect after.
 */
function windowOf(stepId: string) {
  const start = at(`timer.start:${stepId}`);
  return {
    reset: mockEvents.lastIndexOf('driver.resetLongTaskMetrics', start),
    start,
    collect: mockEvents.indexOf('driver.collectLongTaskMetrics', start),
  };
}

/**
 * Assert that `trigger`, the recorded event that starts the step, runs inside
 * `stepId`'s window, before its timer.
 */
function expectTriggerInWindow(stepId: string, trigger: string): void {
  const { reset, start, collect } = windowOf(stepId);
  const triggerAt = at(trigger);
  expect({
    stepId,
    resetBeforeTrigger: reset !== -1 && reset < triggerAt,
  }).toStrictEqual({ stepId, resetBeforeTrigger: true });
  expect(triggerAt).toBeLessThan(start);
  expect(collect).toBeGreaterThan(start);
}

/**
 * Assert that the recorded `event` runs before `stepId`'s window opens.
 */
function expectBeforeWindow(stepId: string, event: string): void {
  expect(at(event)).toBeLessThan(windowOf(stepId).reset);
}

describe('onboarding step windows', () => {
  const originalBrowser = process.env.SELENIUM_BROWSER;

  beforeEach(() => {
    mockEvents.length = 0;
  });
  afterEach(() => {
    if (originalBrowser === undefined) {
      delete process.env.SELENIUM_BROWSER;
    } else {
      process.env.SELENIUM_BROWSER = originalBrowser;
    }
  });

  describe('onboarding-import-wallet', () => {
    it('opens each step window before its trigger on Chrome', async () => {
      process.env.SELENIUM_BROWSER = 'chrome';

      const result = await runImportWallet();

      expect(result.error).toBeUndefined();
      expectTriggerInWindow(
        'importWalletToSocialScreen',
        'StartOnboardingPage.importWallet',
      );
      expectTriggerInWindow(
        'srpButtonToSrpForm',
        'StartOnboardingPage.clickImportWithSrpButton',
      );
      expectTriggerInWindow(
        'confirmSrpToPwForm',
        'OnboardingSrpPage.clickConfirmButton',
      );
      expectTriggerInWindow(
        'pwFormToMetricsScreen',
        'OnboardingPasswordPage.clickCreatePasswordButton',
      );
      expectTriggerInWindow(
        'metricsToWalletReadyScreen',
        'OnboardingMetricsPage.clickOnContinueButton',
      );
      expectTriggerInWindow(
        'openAccountMenuToAccountListLoaded',
        'HeaderNavbar.openAccountMenu',
      );
    });

    it('keeps the harness typing, and the Done step trigger, outside the windows', async () => {
      process.env.SELENIUM_BROWSER = 'chrome';

      await runImportWallet();

      expectBeforeWindow('confirmSrpToPwForm', 'OnboardingSrpPage.fillSrp');
      expectBeforeWindow(
        'pwFormToMetricsScreen',
        'OnboardingPasswordPage.fillWalletPassword',
      );
      expect(mockEvents).not.toContain(
        'OnboardingPasswordPage.createWalletPassword',
      );
      expectBeforeWindow(
        'doneButtonToHomeScreen',
        'OnboardingCompletePage.completeOnboarding',
      );
      expectBeforeWindow(
        'doneButtonToHomeScreen',
        'handleSidepanelPostOnboarding',
      );
    });

    it('opens the window before the password submit that leads to the complete screen on Firefox', async () => {
      process.env.SELENIUM_BROWSER = 'firefox';

      await runImportWallet();

      expect(mockEvents).not.toContain('timer.start:pwFormToMetricsScreen');
      expect(mockEvents).not.toContain(
        'OnboardingMetricsPage.clickOnContinueButton',
      );
      expectTriggerInWindow(
        'metricsToWalletReadyScreen',
        'OnboardingPasswordPage.clickCreatePasswordButton',
      );
    });
  });

  describe('onboarding-new-wallet', () => {
    it('opens each step window before its trigger on Chrome', async () => {
      process.env.SELENIUM_BROWSER = 'chrome';

      const result = await runNewWallet();

      expect(result.error).toBeUndefined();
      expectTriggerInWindow(
        'createWalletToSocialScreen',
        'StartOnboardingPage.createWalletWithSrp',
      );
      expectTriggerInWindow(
        'srpButtonToPwForm',
        'StartOnboardingPage.clickCreateWithSrpButton',
      );
      expectTriggerInWindow(
        'createPwToRecoveryScreen',
        'OnboardingPasswordPage.clickCreatePasswordButton',
      );
      expectTriggerInWindow(
        'skipBackupToMetricsScreen',
        'SecureWalletPage.skipSRPBackup',
      );
      expectTriggerInWindow(
        'agreeButtonToOnboardingSuccess',
        'OnboardingMetricsPage.clickOnContinueButton',
      );
      expectBeforeWindow(
        'createPwToRecoveryScreen',
        'OnboardingPasswordPage.fillWalletPassword',
      );
      expectBeforeWindow(
        'doneButtonToAssetList',
        'OnboardingCompletePage.completeOnboarding',
      );
    });

    it('opens the window before the backup skip that leads to the complete screen on Firefox', async () => {
      process.env.SELENIUM_BROWSER = 'firefox';

      await runNewWallet();

      expect(mockEvents).not.toContain('timer.start:skipBackupToMetricsScreen');
      expectTriggerInWindow(
        'agreeButtonToOnboardingSuccess',
        'SecureWalletPage.skipSRPBackup',
      );
    });
  });
});
