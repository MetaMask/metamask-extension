import { importSRPOnboardingFlow } from '../../page-objects/flows/onboarding.flow';
import OnboardingCompletePage from '../../page-objects/pages/onboarding/onboarding-complete-page';
import type { Driver } from '../../webdriver/driver';
import {
  normalizeSecretRecoveryPhrase,
  runSelfOnboarding,
} from './self-onboarding';

jest.mock('../../page-objects/flows/onboarding.flow', () => ({
  importSRPOnboardingFlow: jest.fn(),
}));

const mockCompleteLoaded = jest.fn();
const mockCompleteOnboarding = jest.fn();

jest.mock(
  '../../page-objects/pages/onboarding/onboarding-complete-page',
  () => ({
    // eslint-disable-next-line @typescript-eslint/naming-convention
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      checkPageIsLoaded: mockCompleteLoaded,
      completeOnboarding: mockCompleteOnboarding,
    })),
  }),
);

const mockFlow = jest.mocked(importSRPOnboardingFlow);

const PHRASE =
  'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';

const PASSWORD = 'correct horse battery staple';

const driver = { timeout: 30_000 } as unknown as Driver;

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

describe('runSelfOnboarding', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFlow.mockResolvedValue(undefined);
    mockCompleteLoaded.mockResolvedValue(undefined);
    mockCompleteOnboarding.mockResolvedValue(undefined);
  });

  it('imports the phrase with the given password through the e2e onboarding flow, then finishes the completion page', async () => {
    await runSelfOnboarding(driver, `${PHRASE}\n`, PASSWORD);

    expect(mockFlow).toHaveBeenCalledWith({
      driver,
      seedPhrase: PHRASE,
      password: PASSWORD,
      needNavigateToNewPage: false,
    });
    expect(OnboardingCompletePage).toHaveBeenCalledWith(driver);
    expect(mockCompleteLoaded).toHaveBeenCalled();
    expect(mockCompleteOnboarding).toHaveBeenCalled();
  });

  it('does not start the flow for an invalid phrase', async () => {
    await expect(
      runSelfOnboarding(driver, 'one two three', PASSWORD),
    ).rejects.toThrow('secret recovery phrase must be 12 or 24 words');
    expect(mockFlow).not.toHaveBeenCalled();
  });

  it('reports flow errors that do not contain secrets', async () => {
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
