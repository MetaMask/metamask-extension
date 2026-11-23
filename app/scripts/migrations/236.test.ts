import { captureException } from '../../../shared/lib/sentry';
import { migrate, version } from './236';

jest.mock('../../../shared/lib/sentry', () => ({
  captureException: jest.fn(),
}));

const mockedCaptureException = jest.mocked(captureException);

const VERSION = version;
const OLD_VERSION = VERSION - 1;

type VersionedData = {
  meta: { version: number };
  data: Record<string, unknown>;
};

const createState = (data: Record<string, unknown>): VersionedData => ({
  meta: { version: OLD_VERSION },
  data,
});

describe(`migration #${VERSION}`, () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('bumps the version', async () => {
    const oldStorage = createState({ OtherController: { preserved: true } });

    await migrate(oldStorage, new Set<string>());

    expect(oldStorage.meta.version).toBe(VERSION);
  });

  it('carries a pending opt-in into AnalyticsController and drops the legacy state', async () => {
    const oldStorage = createState({
      MarketingConsentController: { pendingMarketingConsent: true },
      AnalyticsController: {
        analyticsId: 'analytics-id',
        optedIn: true,
        consentDecisionMade: true,
        optedInToMarketing: false,
        marketingConsentDecisionMade: false,
      },
    });
    const changedControllers = new Set<string>();

    await migrate(oldStorage, changedControllers);

    expect(oldStorage.data).not.toHaveProperty('MarketingConsentController');
    expect(oldStorage.data.AnalyticsController).toStrictEqual({
      analyticsId: 'analytics-id',
      optedIn: true,
      consentDecisionMade: true,
      optedInToMarketing: true,
      marketingConsentDecisionMade: true,
      marketingConsentSyncPending: true,
    });
    expect(changedControllers.has('MarketingConsentController')).toBe(true);
    expect(changedControllers.has('AnalyticsController')).toBe(true);
    expect(mockedCaptureException).not.toHaveBeenCalled();
  });

  it('carries a pending opt-out into AnalyticsController', async () => {
    const oldStorage = createState({
      MarketingConsentController: { pendingMarketingConsent: false },
      AnalyticsController: {
        optedInToMarketing: true,
        marketingConsentDecisionMade: true,
      },
    });

    await migrate(oldStorage, new Set<string>());

    expect(oldStorage.data.AnalyticsController).toStrictEqual({
      optedInToMarketing: false,
      marketingConsentDecisionMade: true,
      marketingConsentSyncPending: true,
    });
  });

  it('drops the legacy state without touching AnalyticsController when nothing is pending', async () => {
    const oldStorage = createState({
      MarketingConsentController: { pendingMarketingConsent: null },
      AnalyticsController: {
        optedInToMarketing: false,
        marketingConsentDecisionMade: true,
      },
    });
    const changedControllers = new Set<string>();

    await migrate(oldStorage, changedControllers);

    expect(oldStorage.data).not.toHaveProperty('MarketingConsentController');
    expect(oldStorage.data.AnalyticsController).toStrictEqual({
      optedInToMarketing: false,
      marketingConsentDecisionMade: true,
    });
    expect(changedControllers.has('MarketingConsentController')).toBe(true);
    expect(changedControllers.has('AnalyticsController')).toBe(false);
  });

  it('does nothing when the legacy controller is absent', async () => {
    const oldStorage = createState({ OtherController: { preserved: true } });
    const changedControllers = new Set<string>();

    await migrate(oldStorage, changedControllers);

    expect(oldStorage.data).toStrictEqual({
      OtherController: { preserved: true },
    });
    expect(changedControllers.size).toBe(0);
    expect(mockedCaptureException).not.toHaveBeenCalled();
  });

  it('drops an invalid legacy value without copying it', async () => {
    const oldStorage = createState({
      MarketingConsentController: { pendingMarketingConsent: 'yes' },
      AnalyticsController: { optedInToMarketing: false },
    });
    const changedControllers = new Set<string>();

    await migrate(oldStorage, changedControllers);

    expect(oldStorage.data).not.toHaveProperty('MarketingConsentController');
    expect(oldStorage.data.AnalyticsController).toStrictEqual({
      optedInToMarketing: false,
    });
    expect(changedControllers.has('AnalyticsController')).toBe(false);
  });

  it('creates AnalyticsController state when it is missing', async () => {
    const oldStorage = createState({
      MarketingConsentController: { pendingMarketingConsent: true },
    });
    const changedControllers = new Set<string>();

    await migrate(oldStorage, changedControllers);

    expect(oldStorage.data).not.toHaveProperty('MarketingConsentController');
    expect(oldStorage.data.AnalyticsController).toStrictEqual({
      optedInToMarketing: true,
      marketingConsentDecisionMade: true,
      marketingConsentSyncPending: true,
    });
    expect(changedControllers.has('AnalyticsController')).toBe(true);
    expect(mockedCaptureException).not.toHaveBeenCalled();
  });

  it('reports and drops a non-object legacy value', async () => {
    const oldStorage = createState({
      MarketingConsentController: 'invalid',
      AnalyticsController: { optedInToMarketing: false },
    });
    const changedControllers = new Set<string>();

    await migrate(oldStorage, changedControllers);

    expect(oldStorage.data).not.toHaveProperty('MarketingConsentController');
    expect(oldStorage.data.AnalyticsController).toStrictEqual({
      optedInToMarketing: false,
    });
    expect(changedControllers.has('MarketingConsentController')).toBe(true);
    expect(mockedCaptureException).toHaveBeenCalledTimes(1);
  });
});
