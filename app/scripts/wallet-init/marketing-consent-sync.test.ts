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
const INVALIDATE_CONSENT_ACTION =
  'AuthenticatedUserStorageService:invalidateQueries';
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
  putConsent = () => Promise.resolve(),
}: {
  analyticsState?: Partial<AnalyticsControllerState>;
  authenticationState?: Partial<AuthenticationControllerState>;
  remoteConsent?: { marketingConsentEnabled: boolean } | null;
  getConsent?: () => Promise<{ marketingConsentEnabled: boolean } | null>;
  putConsent?: () => Promise<void>;
} = {}) {
  const handlers: Record<string, (state: unknown) => void> = {};
  let currentAnalyticsState = analyticsState;
  const currentAuthenticationState = authenticationState;
  const call = jest.fn((action: string) => {
    if (action === 'AnalyticsController:getState') {
      return currentAnalyticsState;
    }
    if (action === 'AuthenticationController:getState') {
      return currentAuthenticationState;
    }
    if (action === GET_CONSENT_ACTION) {
      return getConsent();
    }
    if (action === PUT_CONSENT_ACTION) {
      return putConsent();
    }
    if (action === 'MetaMetricsController:getState') {
      return { marketingCampaignCookieId: null };
    }
    if (action === OPT_IN_ACTION || action === OPT_OUT_ACTION) {
      currentAnalyticsState = {
        ...currentAnalyticsState,
        optedInToMarketing: action === OPT_IN_ACTION,
        marketingConsentDecisionMade: true,
      };
      handlers['AnalyticsController:stateChange']?.(currentAnalyticsState);
      return Promise.resolve();
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
  const waitForSync = setupMarketingConsentSync({ messenger });

  return { handlers, call, delegate, waitForSync };
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

  it('uses existing AUS consent when the first local decision enabled marketing', async () => {
    const { handlers, call, waitForSync } = setupSync({
      analyticsState: {
        optedInToMarketing: false,
        marketingConsentDecisionMade: false,
      },
      authenticationState: { isSignedIn: true },
      remoteConsent: { marketingConsentEnabled: false },
    });

    handlers['AnalyticsController:stateChange']({
      optedInToMarketing: true,
      marketingConsentDecisionMade: true,
    });
    await flushPromises();

    expect(call).toHaveBeenCalledWith(OPT_OUT_ACTION);
    expect(call).not.toHaveBeenCalledWith(PUT_CONSENT_ACTION);
    await expect(waitForSync(true)).rejects.toThrow(
      'Marketing consent was not saved to AUS',
    );
  });

  it('waits for the consent PUT before resolving for the UI', async () => {
    let resolvePut: (() => void) | undefined;
    const put = new Promise<void>((resolve) => {
      resolvePut = resolve;
    });
    const { handlers, waitForSync } = setupSync({
      analyticsState: {
        optedInToMarketing: false,
        marketingConsentDecisionMade: true,
      },
      authenticationState: { isSignedIn: true },
      remoteConsent: { marketingConsentEnabled: false },
      putConsent: () => put,
    });
    await flushPromises();

    handlers['AnalyticsController:stateChange']({
      optedInToMarketing: true,
      marketingConsentDecisionMade: true,
    });
    const onSynced = jest.fn();
    const wait = waitForSync(true).then(onSynced);
    await flushPromises();
    expect(onSynced).not.toHaveBeenCalled();

    resolvePut?.();
    await wait;
    expect(onSynced).toHaveBeenCalledTimes(1);
  });

  it('rejects the UI wait when the AUS PUT fails and retries the latest decision', async () => {
    let fail = true;
    const consoleError = jest
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
    const { handlers, waitForSync, call } = setupSync({
      analyticsState: {
        optedInToMarketing: false,
        marketingConsentDecisionMade: true,
      },
      authenticationState: { isSignedIn: true },
      remoteConsent: { marketingConsentEnabled: false },
      putConsent: () => {
        if (fail) {
          fail = false;
          return Promise.reject(new Error('AUS unavailable'));
        }
        return Promise.resolve();
      },
    });
    await flushPromises();

    handlers['AnalyticsController:stateChange']({
      optedInToMarketing: true,
      marketingConsentDecisionMade: true,
    });
    await expect(waitForSync(true)).rejects.toThrow('AUS unavailable');
    await waitForSync(true);

    expect(
      call.mock.calls.filter(([action]) => action === PUT_CONSENT_ACTION),
    ).toHaveLength(2);
    consoleError.mockRestore();
  });

  it('does not restore an older failed PUT over a newer opt-out', async () => {
    let rejectPut: ((error: Error) => void) | undefined;
    const firstPut = new Promise<void>((_resolve, reject) => {
      rejectPut = reject;
    });
    let writes = 0;
    const consoleError = jest
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
    const { call, handlers } = setupSync({
      analyticsState: {
        optedInToMarketing: false,
        marketingConsentDecisionMade: true,
      },
      authenticationState: { isSignedIn: true },
      remoteConsent: { marketingConsentEnabled: false },
      putConsent: () => {
        writes += 1;
        return writes === 1 ? firstPut : Promise.resolve();
      },
    });
    await flushPromises();
    handlers['AnalyticsController:stateChange']({
      optedInToMarketing: true,
      marketingConsentDecisionMade: true,
    });
    handlers['AnalyticsController:stateChange']({
      optedInToMarketing: false,
      marketingConsentDecisionMade: true,
    });
    rejectPut?.(new Error('failed true write'));
    await flushPromises();

    expect(
      call.mock.calls.filter(([action]) => action === PUT_CONSENT_ACTION),
    ).toHaveLength(1);
    consoleError.mockRestore();
  });

  it('ignores a failed old-profile PUT when the signed-in profile changes', async () => {
    let rejectOldPut: ((error: Error) => void) | undefined;
    const oldPut = new Promise<void>((_resolve, reject) => {
      rejectOldPut = reject;
    });
    let writes = 0;
    const consoleError = jest
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
    const { handlers, call } = setupSync({
      analyticsState: {
        optedInToMarketing: false,
        marketingConsentDecisionMade: true,
      },
      authenticationState: { isSignedIn: true },
      remoteConsent: { marketingConsentEnabled: false },
      putConsent: () => {
        writes += 1;
        return writes === 1 ? oldPut : Promise.resolve();
      },
    });
    await flushPromises();
    handlers['AnalyticsController:stateChange']({
      optedInToMarketing: true,
      marketingConsentDecisionMade: true,
    });
    handlers['AuthenticationController:stateChange']({ isSignedIn: false });
    handlers['AnalyticsController:stateChange']({
      optedInToMarketing: false,
      marketingConsentDecisionMade: true,
    });
    rejectOldPut?.(new Error('old profile unavailable'));
    await flushPromises();
    handlers['AuthenticationController:stateChange']({ isSignedIn: true });
    await flushPromises();

    expect(writes).toBe(1);
    expect(
      call.mock.calls.filter(([action]) => action === PUT_CONSENT_ACTION),
    ).toHaveLength(1);
    consoleError.mockRestore();
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

  it('invalidates cached AUS consent when the signed-in profile changes', async () => {
    const { handlers, call } = setupSync({
      analyticsState: {
        optedInToMarketing: true,
        marketingConsentDecisionMade: true,
      },
      authenticationState: {
        isSignedIn: true,
        srpSessionData: {
          'srp-1': {
            profile: {
              canonicalProfileId: 'profile-one',
              identifierId: 'identifier-1',
              profileId: 'profile-1',
              metaMetricsId: 'metrics-1',
            },
            token: {
              accessToken: 'token-1',
              expiresIn: 3600,
              obtainedAt: 0,
            },
          },
        },
      },
      remoteConsent: { marketingConsentEnabled: true },
    });
    await flushPromises();
    call.mockClear();

    handlers['AuthenticationController:stateChange']({
      isSignedIn: true,
      srpSessionData: {
        'srp-1': {
          profile: {
            canonicalProfileId: 'profile-two',
            identifierId: 'identifier-2',
            profileId: 'profile-2',
            metaMetricsId: 'metrics-2',
          },
          token: {
            accessToken: 'token-2',
            expiresIn: 3600,
            obtainedAt: 0,
          },
        },
      },
    });
    await flushPromises();

    expect(call).toHaveBeenCalledWith(INVALIDATE_CONSENT_ACTION, {
      queryKey: [GET_CONSENT_ACTION],
    });
    expect(call).toHaveBeenCalledWith(GET_CONSENT_ACTION);
  });

  it('clears the marketing campaign cookie when AUS opts the user out', async () => {
    const { call } = setupSync({
      analyticsState: {
        optedInToMarketing: true,
        marketingConsentDecisionMade: true,
      },
      authenticationState: { isSignedIn: true },
      remoteConsent: { marketingConsentEnabled: false },
    });
    call.mockImplementation((action: string) => {
      if (action === 'AnalyticsController:getState') {
        return {
          optedInToMarketing: true,
          marketingConsentDecisionMade: true,
        };
      }
      if (action === 'AuthenticationController:getState') {
        return { isSignedIn: true };
      }
      if (action === GET_CONSENT_ACTION) {
        return Promise.resolve({ marketingConsentEnabled: false });
      }
      if (action === 'MetaMetricsController:getState') {
        return { marketingCampaignCookieId: 'campaign-cookie' };
      }
      return Promise.resolve();
    });
    await flushPromises();

    expect(call).toHaveBeenCalledWith(OPT_OUT_ACTION);
    expect(call).toHaveBeenCalledWith(
      'MetaMetricsController:setMarketingCampaignCookieId',
      null,
    );
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

  it('does not start a local AUS write until an in-flight initial read completes', async () => {
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
    await flushPromises();
    expect(call).not.toHaveBeenCalledWith(PUT_CONSENT_ACTION);

    resolveConsent?.({ marketingConsentEnabled: false });
    await flushPromises();

    expect(call).not.toHaveBeenCalledWith(OPT_OUT_ACTION);
    expect(call).toHaveBeenCalledWith(
      PUT_CONSENT_ACTION,
      { marketingConsentEnabled: true },
      'extension',
    );
  });

  it('leaves a failed AUS seed eligible for a later reconciliation', async () => {
    const consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
    let failPut = true;
    const { call, handlers } = setupSync({
      analyticsState: {
        optedInToMarketing: true,
        marketingConsentDecisionMade: true,
      },
      authenticationState: { isSignedIn: true },
      remoteConsent: null,
      putConsent: () => {
        if (failPut) {
          failPut = false;
          return Promise.reject(new Error('AUS unavailable'));
        }
        return Promise.resolve();
      },
    });
    await flushPromises();
    handlers['AuthenticationController:stateChange']({
      isSignedIn: false,
    });
    handlers['AuthenticationController:stateChange']({ isSignedIn: true });
    await flushPromises();

    expect(
      call.mock.calls.filter(([action]) => action === GET_CONSENT_ACTION),
    ).toHaveLength(2);
    expect(
      call.mock.calls.filter(([action]) => action === PUT_CONSENT_ACTION),
    ).toHaveLength(2);
    consoleErrorSpy.mockRestore();
  });

  it('does not apply AUS consent from a GET started for a previous profile', async () => {
    let resolveFirstRead:
      | ((consent: { marketingConsentEnabled: boolean }) => void)
      | undefined;
    let readNumber = 0;
    const { handlers, call } = setupSync({
      analyticsState: {
        optedInToMarketing: true,
        marketingConsentDecisionMade: true,
      },
      authenticationState: {
        isSignedIn: true,
        srpSessionData: {
          'srp-1': {
            profile: {
              canonicalProfileId: 'profile-one',
              identifierId: 'identifier-1',
              profileId: 'profile-1',
              metaMetricsId: 'metrics-1',
            },
            token: {
              accessToken: 'token-1',
              expiresIn: 3600,
              obtainedAt: 0,
            },
          },
        },
      },
      getConsent: () => {
        readNumber += 1;
        if (readNumber === 1) {
          return new Promise((resolve) => {
            resolveFirstRead = resolve;
          });
        }
        return Promise.resolve({ marketingConsentEnabled: true });
      },
    });

    await flushPromises();
    expect(readNumber).toBe(1);
    handlers['AuthenticationController:stateChange']({
      isSignedIn: true,
      srpSessionData: {
        'srp-1': {
          profile: {
            canonicalProfileId: 'profile-two',
            identifierId: 'identifier-2',
            profileId: 'profile-2',
            metaMetricsId: 'metrics-2',
          },
          token: {
            accessToken: 'token-2',
            expiresIn: 3600,
            obtainedAt: 0,
          },
        },
      },
    });
    resolveFirstRead?.({ marketingConsentEnabled: false });
    await flushPromises();
    await flushPromises();

    expect(call).not.toHaveBeenCalledWith(OPT_OUT_ACTION);
    expect(
      call.mock.calls.filter(([action]) => action === GET_CONSENT_ACTION),
    ).toHaveLength(2);
    expect(call).not.toHaveBeenCalledWith(PUT_CONSENT_ACTION);
  });

  it('does not upload consent while signed out', async () => {
    const { call, handlers } = setupSync({
      analyticsState: {
        optedInToMarketing: true,
        marketingConsentDecisionMade: true,
      },
      authenticationState: { isSignedIn: true },
      remoteConsent: null,
    });

    await flushPromises();
    handlers['AuthenticationController:stateChange']({ isSignedIn: false });
    await flushPromises();
    const putsBeforeLocalChange = call.mock.calls.filter(
      ([action]) => action === PUT_CONSENT_ACTION,
    ).length;
    handlers['AnalyticsController:stateChange']({
      optedInToMarketing: false,
      marketingConsentDecisionMade: true,
    });
    await flushPromises();

    expect(
      call.mock.calls.filter(([action]) => action === PUT_CONSENT_ACTION),
    ).toHaveLength(putsBeforeLocalChange);
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
