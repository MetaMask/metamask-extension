import log from 'loglevel';
import { captureException } from '../../../../shared/lib/sentry';
import {
  runSeedlessOnboardingMigrations,
  type RunSeedlessOnboardingMigrationsMessenger,
} from './run-migrations';

jest.mock('../../../../shared/lib/sentry', () => ({
  captureException: jest.fn(),
}));

const mockedCaptureException = jest.mocked(captureException);

type MockMessengerOptions = {
  completedOnboarding?: boolean;
  migrationVersion?: number;
  runMigrations?: jest.Mock;
  trackEvent?: jest.Mock;
};

/**
 * Build a mock messenger that responds to the actions used by
 * {@link runSeedlessOnboardingMigrations}.
 *
 * @param options - Behaviour overrides for the mocked actions.
 * @param options.completedOnboarding
 * @param options.migrationVersion
 * @param options.runMigrations
 * @param options.trackEvent
 * @returns The mock messenger plus its underlying action mocks.
 */
function createMockMessenger({
  completedOnboarding = true,
  migrationVersion = 0,
  runMigrations = jest.fn().mockResolvedValue(false),
  trackEvent = jest.fn(),
}: MockMessengerOptions = {}) {
  const call = jest.fn((actionType: string, ...args: unknown[]) => {
    switch (actionType) {
      case 'OnboardingController:getState':
        return { completedOnboarding };
      case 'SeedlessOnboardingController:runMigrations':
        return runMigrations();
      case 'SeedlessOnboardingController:getState':
        return { migrationVersion };
      case 'MetaMetricsController:trackEvent':
        return trackEvent(...args);
      default:
        throw new Error(`Unexpected action: ${actionType}`);
    }
  });

  const messenger = {
    call,
  } as unknown as RunSeedlessOnboardingMigrationsMessenger;

  return { messenger, call, runMigrations, trackEvent };
}

describe('runSeedlessOnboardingMigrations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns early and skips migration when onboarding is not completed', async () => {
    const { messenger, runMigrations, trackEvent } = createMockMessenger({
      completedOnboarding: false,
    });

    await runSeedlessOnboardingMigrations(messenger);

    expect(runMigrations).not.toHaveBeenCalled();
    expect(trackEvent).not.toHaveBeenCalled();
  });

  it('does not track an event when no migration was performed', async () => {
    const { messenger, runMigrations, trackEvent } = createMockMessenger({
      runMigrations: jest.fn().mockResolvedValue(false),
    });

    await runSeedlessOnboardingMigrations(messenger);

    expect(runMigrations).toHaveBeenCalledTimes(1);
    expect(trackEvent).not.toHaveBeenCalled();
  });

  it('tracks a completion event when a migration was performed', async () => {
    const { messenger, trackEvent } = createMockMessenger({
      migrationVersion: 1,
      runMigrations: jest.fn().mockResolvedValue(true),
    });

    await runSeedlessOnboardingMigrations(messenger);

    expect(trackEvent).toHaveBeenCalledWith({
      event: 'Seedless Onboarding Migration Completed',
      category: 'Background',
      // eslint-disable-next-line @typescript-eslint/naming-convention
      properties: { migration_version: 1 },
    });
  });

  it('tracks a failure event, reports to Sentry, and re-throws when migration fails', async () => {
    const migrationError = new Error('migration failed');
    const { messenger, trackEvent } = createMockMessenger({
      migrationVersion: 0,
      runMigrations: jest.fn().mockRejectedValue(migrationError),
    });

    await expect(runSeedlessOnboardingMigrations(messenger)).rejects.toThrow(
      'migration failed',
    );

    expect(trackEvent).toHaveBeenCalledWith({
      event: 'Seedless Onboarding Migration Failed',
      category: 'Background',
      // eslint-disable-next-line @typescript-eslint/naming-convention
      properties: { migration_version: 0, error: 'migration failed' },
    });
    expect(mockedCaptureException).toHaveBeenCalledWith(migrationError);
  });

  it('wraps non-Error thrown values in a new Error before re-throwing', async () => {
    const { messenger, trackEvent } = createMockMessenger({
      runMigrations: jest.fn().mockRejectedValue('string error'),
    });

    await expect(runSeedlessOnboardingMigrations(messenger)).rejects.toThrow(
      'Unknown error',
    );

    expect(trackEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        event: 'Seedless Onboarding Migration Failed',
        properties: expect.objectContaining({ error: 'Unknown error' }),
      }),
    );
  });

  it('logs warnings and still re-throws when MetaMetrics tracking or Sentry reporting fail', async () => {
    const { messenger } = createMockMessenger({
      runMigrations: jest.fn().mockRejectedValue(new Error('migration failed')),
      trackEvent: jest.fn().mockImplementation(() => {
        throw new Error('trackEvent failed');
      }),
    });
    mockedCaptureException.mockImplementation(() => {
      throw new Error('sentry capture failed');
    });
    const logWarnSpy = jest.spyOn(log, 'warn').mockImplementation(jest.fn());

    await expect(runSeedlessOnboardingMigrations(messenger)).rejects.toThrow(
      'migration failed',
    );

    expect(logWarnSpy).toHaveBeenCalledWith(
      'Failed to track seedless onboarding migration failure',
      expect.any(Error),
    );
    expect(logWarnSpy).toHaveBeenCalledWith(
      'Failed to capture seedless onboarding migration failure',
      expect.any(Error),
    );
  });
});
