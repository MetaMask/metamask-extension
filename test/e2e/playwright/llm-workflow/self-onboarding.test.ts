import { importSRPOnboardingFlow } from '../../page-objects/flows/onboarding.flow';
import LoginPage from '../../page-objects/pages/onboarding/login-page';
import OnboardingCompletePage from '../../page-objects/pages/onboarding/onboarding-complete-page';
import type { Driver } from '../../webdriver/driver';
import { waitForAnyScreen } from './launcher/state-inspector';
import {
  finishOnboarding,
  normalizeSecretRecoveryPhrase,
  runSelfOnboarding,
} from './self-onboarding';

jest.mock('../../page-objects/flows/onboarding.flow', () => ({
  importSRPOnboardingFlow: jest.fn(),
}));

jest.mock('./launcher/state-inspector', () => ({
  SCREEN_CHECKS: [
    { screen: 'unlock' },
    { screen: 'onboarding-welcome' },
    { screen: 'home' },
    { screen: 'onboarding-complete' },
  ],
  waitForAnyScreen: jest.fn(),
}));

const mockCompleteOnboarding = jest.fn();
const mockLogin = jest.fn();

jest.mock(
  '../../page-objects/pages/onboarding/onboarding-complete-page',
  () => ({
    // eslint-disable-next-line @typescript-eslint/naming-convention
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      completeOnboarding: mockCompleteOnboarding,
    })),
  }),
);

jest.mock('../../page-objects/pages/onboarding/login-page', () => ({
  // eslint-disable-next-line @typescript-eslint/naming-convention
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    loginToHomepage: mockLogin,
  })),
}));

const mockFlow = jest.mocked(importSRPOnboardingFlow);
const mockWaitForAnyScreen = jest.mocked(waitForAnyScreen);

const PHRASE =
  'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';

const PASSWORD = 'correct horse battery staple';

const driver = { timeout: 30_000 } as unknown as Driver;

function showScreens(...screens: string[]) {
  for (const screen of screens) {
    mockWaitForAnyScreen.mockResolvedValueOnce({ screen } as never);
  }
}

describe('normalizeSecretRecoveryPhrase', () => {
  it('collapses whitespace', () => {
    expect(
      normalizeSecretRecoveryPhrase(`  ${PHRASE.replace(/ /gu, '\n ')}\n`),
    ).toBe(PHRASE);
  });

  it('rejects phrases that are not 12 or 24 words', () => {
    expect(() => normalizeSecretRecoveryPhrase('one two three')).toThrow(
      'secret recovery phrase must be 12 or 24 words',
    );
  });

  it('rejects canary marker strings', () => {
    const canary = `CANARY-NOT-A-REAL-SRP-${' x'.repeat(11)}`;
    expect(() => normalizeSecretRecoveryPhrase(canary)).toThrow(
      'marker strings cannot onboard MetaMask',
    );
  });
});

describe('finishOnboarding', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockWaitForAnyScreen.mockReset();
  });

  it('only waits on the completion, unlock and home screens', async () => {
    showScreens('home');

    await finishOnboarding(driver, PASSWORD);

    const [, checks] = mockWaitForAnyScreen.mock.calls[0];
    expect(checks.map(({ screen }) => screen)).toStrictEqual([
      'unlock',
      'home',
      'onboarding-complete',
    ]);
  });

  it('confirms the completion page', async () => {
    showScreens('onboarding-complete');

    await finishOnboarding(driver, PASSWORD);

    expect(OnboardingCompletePage).toHaveBeenCalledWith(driver);
    expect(mockCompleteOnboarding).toHaveBeenCalled();
    expect(mockLogin).not.toHaveBeenCalled();
  });

  it('unlocks with the password, then confirms the completion page', async () => {
    showScreens('unlock', 'onboarding-complete');

    await finishOnboarding(driver, PASSWORD);

    expect(LoginPage).toHaveBeenCalledWith(driver);
    expect(mockLogin).toHaveBeenCalledWith(PASSWORD);
    expect(mockCompleteOnboarding).toHaveBeenCalled();
  });

  it('stops once home is shown after unlocking', async () => {
    showScreens('unlock', 'home');

    await finishOnboarding(driver, PASSWORD);

    expect(mockLogin).toHaveBeenCalledTimes(1);
    expect(mockCompleteOnboarding).not.toHaveBeenCalled();
  });

  it('does not accept the unlock page again after unlocking', async () => {
    showScreens('unlock', 'home');

    await finishOnboarding(driver, PASSWORD);

    const [, checks] = mockWaitForAnyScreen.mock.calls[1];
    expect(checks.map(({ screen }) => screen)).toStrictEqual([
      'home',
      'onboarding-complete',
    ]);
  });

  it('fails when unlocking does not leave the unlock page', async () => {
    showScreens('unlock');
    mockWaitForAnyScreen.mockRejectedValueOnce(new Error('timed out'));

    await expect(finishOnboarding(driver, PASSWORD)).rejects.toThrow(
      'timed out',
    );
    expect(mockLogin).toHaveBeenCalledTimes(1);
  });
});

describe('runSelfOnboarding', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockWaitForAnyScreen.mockReset();
    mockFlow.mockResolvedValue(undefined);
  });

  it('imports the phrase through the e2e onboarding flow', async () => {
    await runSelfOnboarding(driver, `${PHRASE}\n`, PASSWORD);

    expect(mockFlow).toHaveBeenCalledWith({
      driver,
      seedPhrase: PHRASE,
      password: PASSWORD,
      needNavigateToNewPage: false,
    });
    expect(mockWaitForAnyScreen).not.toHaveBeenCalled();
    expect(mockCompleteOnboarding).not.toHaveBeenCalled();
  });

  it('does not start the flow for an invalid phrase', async () => {
    await expect(
      runSelfOnboarding(driver, 'one two three', PASSWORD),
    ).rejects.toThrow('secret recovery phrase must be 12 or 24 words');
    expect(mockFlow).not.toHaveBeenCalled();
  });

  it('reports flow errors that do not contain the phrase', async () => {
    mockFlow.mockRejectedValue(new Error('Waiting for element timed out'));

    await expect(runSelfOnboarding(driver, PHRASE, PASSWORD)).rejects.toThrow(
      'self-onboarding failed: Waiting for element timed out',
    );
  });

  it('drops flow errors that contain the phrase', async () => {
    mockFlow.mockRejectedValueOnce(new Error(`could not paste ${PHRASE}`));

    await expect(runSelfOnboarding(driver, PHRASE, PASSWORD)).rejects.toThrow(
      /^self-onboarding failed$/u,
    );
  });
});
