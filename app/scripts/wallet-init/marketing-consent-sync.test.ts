import { Messenger } from '@metamask/messenger';
import type { AnalyticsControllerState } from '@metamask/analytics-controller';
import type { AuthenticationControllerState } from '@metamask/profile-sync-controller/auth';
import { setupMarketingConsentSync } from './marketing-consent-sync';

jest.mock('@metamask/messenger', () => ({
  Messenger: jest.fn(),
}));

type SyncArgs = Parameters<typeof setupMarketingConsentSync>[0];

const GET_CONSENT_ACTION =
  'AuthenticatedUserStorageService:getMarketingConsent';
const PUT_CONSENT_ACTION =
  'AuthenticatedUserStorageService:putMarketingConsent';
const OPT_IN_ACTION = 'AnalyticsController:optInToMarketing';
const OPT_OUT_ACTION = 'AnalyticsController:optOutOfMarketing';

const flushPromises = () => new Promise((resolve) => setTimeout(resolve, 0));

function setupSync({
  analyticsState = {
    optedInToMarketing: false,
    marketingConsentDecisionMade: false,
  },
  authenticationState = { isSignedIn: false },
  remoteConsent = null,
  getConsent = () => Promise.resolve(remoteConsent),
}: {
  analyticsState?: Partial<AnalyticsControllerState>;
  authenticationState?: Partial<AuthenticationControllerState>;
  remoteConsent?: { marketingConsentEnabled: boolean } | null;
  getConsent?: () => Promise<{ marketingConsentEnabled: boolean } | null>;
} = {}) {
  const handlers: Record<string, (state: unknown) => void> = {};
  const calls: unknown[][] = [];
  const call = jest.fn((action: string) => {
    calls.push([action]);
    if (action === 'AnalyticsController:getState') {
      return analyticsState;
    }
    if (action === 'AuthenticationController:getState') {
      return authenticationState;
    }
    if (action === GET_CONSENT_ACTION) {
      return getConsent();
    }
    return Promise.resolve();
  });
  const syncMessenger = {
    call,
    subscribe: jest.fn((event: string, handler: (state: unknown) => void) => {
      handlers[event] = handler;
    }),
  };
  (Messenger as jest.Mock).mockImplementation(() => syncMessenger);

  const delegate = jest.fn();
  const messenger = { delegate } as unknown as SyncArgs['messenger'];
  setupMarketingConsentSync({ messenger });

  return { handlers, call, calls, delegate };
}

describe('setupMarketingConsentSync', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('waits until signed in and the user has made a marketing decision', async () => {
    const { handlers, call } = setupSync();

    expect(call).not.toHaveBeenCalledWith(GET_CONSENT_ACTION);

    handlers['AuthenticationController:stateChange']({ isSignedIn: true });
    await flushPromises();
    expect(call).not.toHaveBeenCalledWith(GET_CONSENT_ACTION);

    handlers['AnalyticsController:stateChange']({
      optedInToMarketing: false,
      marketingConsentDecisionMade: true,
    });
    await flushPromises();

    expect(call).toHaveBeenCalledWith(GET_CONSENT_ACTION);
    expect(call).toHaveBeenCalledWith(
      PUT_CONSENT_ACTION,
      {
        marketingConsentEnabled: false,
      },
      'extension',
    );
  });

  [true, false].forEach((marketingConsentEnabled) => {
    it(`applies AUS consent ${marketingConsentEnabled} to AnalyticsController`, async () => {
      const { call } = setupSync({
        analyticsState: {
          optedInToMarketing: !marketingConsentEnabled,
          marketingConsentDecisionMade: true,
        },
        authenticationState: { isSignedIn: true },
        remoteConsent: { marketingConsentEnabled },
      });
      await flushPromises();

      expect(call).toHaveBeenCalledWith(
        marketingConsentEnabled ? OPT_IN_ACTION : OPT_OUT_ACTION,
      );
      expect(call).not.toHaveBeenCalledWith(PUT_CONSENT_ACTION);
    });
  });

  it('does not reconcile an undecided local value', async () => {
    const { call, handlers } = setupSync({
      analyticsState: {
        optedInToMarketing: true,
        marketingConsentDecisionMade: false,
      },
      authenticationState: { isSignedIn: true },
      remoteConsent: null,
    });
    await flushPromises();

    expect(call).not.toHaveBeenCalledWith(GET_CONSENT_ACTION);
    expect(call).not.toHaveBeenCalledWith(PUT_CONSENT_ACTION);
  });

  it('writes subsequent local consent changes to AUS', async () => {
    const { handlers, call } = setupSync({
      analyticsState: {
        optedInToMarketing: false,
        marketingConsentDecisionMade: true,
      },
      authenticationState: { isSignedIn: true },
      remoteConsent: { marketingConsentEnabled: false },
    });
    await flushPromises();

    handlers['AnalyticsController:stateChange']({
      optedInToMarketing: true,
      marketingConsentDecisionMade: true,
    });
    await flushPromises();

    expect(call).toHaveBeenCalledWith(
      PUT_CONSENT_ACTION,
      { marketingConsentEnabled: true },
      'extension',
    );
  });

  it('applies remote consent without echoing a PUT', async () => {
    const { call, handlers } = setupSync({
      analyticsState: {
        optedInToMarketing: false,
        marketingConsentDecisionMade: true,
      },
      authenticationState: { isSignedIn: true },
      remoteConsent: { marketingConsentEnabled: true },
    });
    await flushPromises();

    handlers['AnalyticsController:stateChange']({
      optedInToMarketing: true,
      marketingConsentDecisionMade: true,
    });
    await flushPromises();

    expect(call).toHaveBeenCalledWith(OPT_IN_ACTION);
    expect(call).not.toHaveBeenCalledWith(PUT_CONSENT_ACTION);
  });

  it('coalesces consent changes while an AUS write is pending', async () => {
    let resolveFirstWrite: (() => void) | undefined;
    const firstWrite = new Promise<void>((resolve) => {
      resolveFirstWrite = resolve;
    });
    const { handlers, call } = setupSync({
      analyticsState: {
        optedInToMarketing: false,
        marketingConsentDecisionMade: true,
      },
      authenticationState: { isSignedIn: true },
      remoteConsent: { marketingConsentEnabled: false },
    });
    await flushPromises();
    call.mockImplementation((action: string) => {
      if (action === 'AnalyticsController:getState') {
        return {
          optedInToMarketing: false,
          marketingConsentDecisionMade: true,
        };
      }
      if (action === 'AuthenticationController:getState') {
        return { isSignedIn: true };
      }
      if (action === PUT_CONSENT_ACTION) {
        return firstWrite;
      }
      if (action === GET_CONSENT_ACTION) {
        return Promise.resolve({ marketingConsentEnabled: false });
      }
      return Promise.resolve();
    });

    handlers['AnalyticsController:stateChange']({
      optedInToMarketing: true,
      marketingConsentDecisionMade: true,
    });
    handlers['AnalyticsController:stateChange']({
      optedInToMarketing: false,
      marketingConsentDecisionMade: true,
    });
    await flushPromises();
    resolveFirstWrite?.();
    await flushPromises();

    expect(
      call.mock.calls.filter(([action]) => action === PUT_CONSENT_ACTION),
    ).toEqual([
      [PUT_CONSENT_ACTION, { marketingConsentEnabled: true }, 'extension'],
      [PUT_CONSENT_ACTION, { marketingConsentEnabled: false }, 'extension'],
    ]);
  });

  it('keeps a newer local decision when it changes during the AUS read', async () => {
    let resolveConsent:
      | ((consent: { marketingConsentEnabled: boolean }) => void)
      | undefined;
    const remoteConsent = new Promise<{ marketingConsentEnabled: boolean }>(
      (resolve) => {
        resolveConsent = resolve;
      },
    );
    const { handlers, call } = setupSync({
      analyticsState: {
        optedInToMarketing: false,
        marketingConsentDecisionMade: true,
      },
      authenticationState: { isSignedIn: true },
      getConsent: () => remoteConsent,
    });

    handlers['AnalyticsController:stateChange']({
      optedInToMarketing: true,
      marketingConsentDecisionMade: true,
    });
    resolveConsent?.({ marketingConsentEnabled: false });
    await flushPromises();

    expect(call).not.toHaveBeenCalledWith(OPT_OUT_ACTION);
    expect(call).toHaveBeenCalledWith(
      PUT_CONSENT_ACTION,
      { marketingConsentEnabled: true },
      'extension',
    );
  });

  it('leaves local state unchanged when the AUS read fails', async () => {
    const consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
    const { call } = setupSync({
      analyticsState: {
        optedInToMarketing: true,
        marketingConsentDecisionMade: true,
      },
      authenticationState: { isSignedIn: true },
      getConsent: () => Promise.reject(new Error('AUS unavailable')),
    });

    await flushPromises();

    expect(call).not.toHaveBeenCalledWith(OPT_IN_ACTION);
    expect(call).not.toHaveBeenCalledWith(OPT_OUT_ACTION);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Failed to synchronize marketing consent with AUS:',
      expect.any(Error),
    );
    consoleErrorSpy.mockRestore();
  });
});
