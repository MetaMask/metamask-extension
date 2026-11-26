import { captureException } from '../../../shared/lib/sentry';
import { migrate, version } from './239';

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

  it('adopts a pending opt-in when Analytics is undecided', async () => {
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

  it('adopts a pending opt-in when the existing decision agrees', async () => {
    const oldStorage = createState({
      MarketingConsentController: { pendingMarketingConsent: true },
      AnalyticsController: {
        optedInToMarketing: true,
        marketingConsentDecisionMade: true,
      },
    });
    const changedControllers = new Set<string>();

    await migrate(oldStorage, changedControllers);

    expect(oldStorage.data.AnalyticsController).toStrictEqual({
      optedInToMarketing: true,
      marketingConsentDecisionMade: true,
      marketingConsentSyncPending: true,
    });
    expect(changedControllers.has('AnalyticsController')).toBe(true);
  });

  it('adopts a pending opt-out and clears the marketing campaign cookie id', async () => {
    const oldStorage = createState({
      MarketingConsentController: { pendingMarketingConsent: false },
      AnalyticsController: {
        optedInToMarketing: true,
        marketingConsentDecisionMade: false,
        marketingCampaignCookieId: 'campaign-cookie-id',
      },
    });

    await migrate(oldStorage, new Set<string>());

    expect(oldStorage.data.AnalyticsController).toStrictEqual({
      optedInToMarketing: false,
      marketingConsentDecisionMade: true,
      marketingConsentSyncPending: true,
      marketingCampaignCookieId: null,
    });
  });

  it('skips a pending value that contradicts an existing decision', async () => {
    const oldStorage = createState({
      MarketingConsentController: { pendingMarketingConsent: true },
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
    expect(mockedCaptureException).not.toHaveBeenCalled();
  });

  it('skips a pending value while a canonical choice is waiting to be saved', async () => {
    const oldStorage = createState({
      MarketingConsentController: { pendingMarketingConsent: true },
      AnalyticsController: {
        optedInToMarketing: false,
        marketingConsentDecisionMade: false,
        marketingConsentSyncPending: true,
      },
    });
    const changedControllers = new Set<string>();

    await migrate(oldStorage, changedControllers);

    expect(oldStorage.data).not.toHaveProperty('MarketingConsentController');
    expect(oldStorage.data.AnalyticsController).toStrictEqual({
      optedInToMarketing: false,
      marketingConsentDecisionMade: false,
      marketingConsentSyncPending: true,
    });
    expect(changedControllers.has('MarketingConsentController')).toBe(true);
    expect(changedControllers.has('AnalyticsController')).toBe(false);
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
