import { Messenger } from '@metamask/messenger';
import type { AnalyticsControllerState } from '@metamask/analytics-controller';
import type { NotificationPreferences } from '@metamask/authenticated-user-storage';
import type { AuthenticationControllerState } from '@metamask/profile-sync-controller/auth';
import type { KeyringControllerState } from '@metamask/keyring-controller';
import { setupMarketingConsentSync } from './marketing-consent-sync';

jest.mock('@metamask/messenger', () => ({
  Messenger: jest.fn(),
}));

type SyncArgs = Parameters<typeof setupMarketingConsentSync>[0];

const GET_CONSENT_ACTION =
  'AuthenticatedUserStorageService:getMarketingConsent';
const PUT_CONSENT_ACTION =
  'AuthenticatedUserStorageService:putMarketingConsent';
const INVALIDATE_ACTION = 'AuthenticatedUserStorageService:invalidateQueries';
const GET_PREFERENCES_ACTION =
  'AuthenticatedUserStorageService:getNotificationPreferences';
const PUT_PREFERENCES_ACTION =
  'AuthenticatedUserStorageService:putNotificationPreferences';
const OPT_IN_ACTION = 'AnalyticsController:optInToMarketing';
const OPT_OUT_ACTION = 'AnalyticsController:optOutOfMarketing';

const NOTIFICATION_PREFERENCES: NotificationPreferences = {
  walletActivity: {
    pushNotificationsEnabled: true,
    inAppNotificationsEnabled: true,
    accounts: [],
  },
  marketing: {
    pushNotificationsEnabled: true,
    inAppNotificationsEnabled: true,
  },
  perps: { pushNotificationsEnabled: true, inAppNotificationsEnabled: true },
  socialAI: {
    pushNotificationsEnabled: true,
    inAppNotificationsEnabled: true,
    mutedTraderProfileIds: [],
  },
  agenticCli: {
    pushNotificationsEnabled: true,
    inAppNotificationsEnabled: true,
  },
  priceAlerts: {
    pushNotificationsEnabled: true,
    inAppNotificationsEnabled: true,
  },
};

const flushPromises = () => new Promise((resolve) => setTimeout(resolve, 0));

function profileAuthState(profileNumber: number) {
  return {
    isSignedIn: true,
    srpSessionData: {
      'srp-1': {
        profile: {
          canonicalProfileId: `profile-${profileNumber}`,
          identifierId: `identifier-${profileNumber}`,
          profileId: `profile-${profileNumber}`,
          metaMetricsId: `metrics-${profileNumber}`,
        },
        token: {
          accessToken: `token-${profileNumber}`,
          expiresIn: 3600,
          obtainedAt: 0,
        },
      },
    },
  };
}

function setupSync({
  analyticsState = {
    optedInToMarketing: false,
    marketingConsentDecisionMade: false,
  },
  authenticationState = { isSignedIn: false },
  keyringState = { isUnlocked: true },
  remoteConsent = null,
  getConsent = () => Promise.resolve(remoteConsent),
  putConsent = () => Promise.resolve(),
  getPreferences = () => Promise.resolve(null),
  putPreferences = () => Promise.resolve(),
}: {
  analyticsState?: Partial<AnalyticsControllerState>;
  authenticationState?: Partial<AuthenticationControllerState>;
  keyringState?: Partial<KeyringControllerState>;
  remoteConsent?: { marketingConsentEnabled: boolean } | null;
  getConsent?: () => Promise<{ marketingConsentEnabled: boolean } | null>;
  putConsent?: () => Promise<void>;
  getPreferences?: () => Promise<NotificationPreferences | null>;
  putPreferences?: () => Promise<void>;
} = {}) {
  const handlers: Record<string, (state?: unknown) => void> = {};
  let currentAnalyticsState = analyticsState;
  const currentAuthenticationState = authenticationState;
  const currentKeyringState = keyringState;
  const call = jest.fn((action: string) => {
    if (action === 'AnalyticsController:getState') {
      return currentAnalyticsState;
    }
    if (action === 'AuthenticationController:getState') {
      return currentAuthenticationState;
    }
    if (action === 'KeyringController:getState') {
      return currentKeyringState;
    }
    if (action === GET_CONSENT_ACTION) {
      return getConsent();
    }
    if (action === PUT_CONSENT_ACTION) {
      return putConsent();
    }
    if (action === GET_PREFERENCES_ACTION) {
      return getPreferences();
    }
    if (action === PUT_PREFERENCES_ACTION) {
      return putPreferences();
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
    registerActionHandler: jest.fn(),
    subscribe: jest.fn((event: string, handler: (state?: unknown) => void) => {
      handlers[event] = handler;
    }),
  };
  (Messenger as jest.Mock).mockImplementation(() => syncMessenger);

  const delegate = jest.fn();
  const messenger = { delegate } as unknown as SyncArgs['messenger'];
  const { waitForMarketingConsentSync: waitForSync, refreshMarketingConsent } =
    setupMarketingConsentSync({ messenger });

  return {
    handlers,
    call,
    delegate,
    registerActionHandler: syncMessenger.registerActionHandler,
    waitForSync,
    refreshMarketingConsent,
  };
}

describe('setupMarketingConsentSync', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('uploads the first local decision after sign-in', async () => {
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

    expect(call).not.toHaveBeenCalledWith(GET_CONSENT_ACTION);
    expect(call).toHaveBeenCalledWith(
      PUT_CONSENT_ACTION,
      {
        marketingConsentEnabled: false,
      },
      'extension',
    );
  });

  it('registers the consent wait action on the messenger', async () => {
    const { registerActionHandler } = setupSync({
      analyticsState: {
        optedInToMarketing: true,
        marketingConsentDecisionMade: true,
      },
      authenticationState: { isSignedIn: true },
      remoteConsent: { marketingConsentEnabled: true },
    });
    expect(registerActionHandler).toHaveBeenCalledWith(
      'MarketingConsentSync:waitForMarketingConsentSync',
      expect.any(Function),
    );
  });

  it('does not read AUS while the vault is locked and syncs after unlock', async () => {
    // Sign-in and the consent decision persist across extension restarts, so
    // the sync starts ready — but the vault is still locked at startup and AUS
    // reads need an unlocked wallet to obtain a bearer token.
    const { handlers, call } = setupSync({
      analyticsState: {
        optedInToMarketing: true,
        marketingConsentDecisionMade: true,
      },
      authenticationState: { isSignedIn: true },
      keyringState: { isUnlocked: false },
      remoteConsent: { marketingConsentEnabled: false },
    });
    await flushPromises();

    expect(call).not.toHaveBeenCalledWith(GET_CONSENT_ACTION);
    expect(call).not.toHaveBeenCalledWith(OPT_OUT_ACTION);

    handlers['KeyringController:unlock']();
    await flushPromises();

    expect(call).toHaveBeenCalledWith(GET_CONSENT_ACTION);
    expect(call).toHaveBeenCalledWith(OPT_OUT_ACTION);
    expect(call).not.toHaveBeenCalledWith(PUT_CONSENT_ACTION);
  });

  it('re-reads AUS on refresh after an earlier sync in the same session', async () => {
    let remote = { marketingConsentEnabled: true };
    const { call, refreshMarketingConsent } = setupSync({
      analyticsState: {
        optedInToMarketing: true,
        marketingConsentDecisionMade: true,
      },
      authenticationState: { isSignedIn: true },
      getConsent: () => Promise.resolve(remote),
    });
    await flushPromises();
    expect(call).toHaveBeenCalledWith(GET_CONSENT_ACTION);
    expect(call).not.toHaveBeenCalledWith(OPT_OUT_ACTION);

    // Another device opted out while this background stayed alive.
    remote = { marketingConsentEnabled: false };
    call.mockClear();
    refreshMarketingConsent();
    await flushPromises();

    expect(call).toHaveBeenCalledWith(GET_CONSENT_ACTION);
    expect(call).toHaveBeenCalledWith(OPT_OUT_ACTION);
    expect(call).not.toHaveBeenCalledWith(PUT_CONSENT_ACTION);
  });

  it('re-reads AUS on every unlock', async () => {
    let remote = { marketingConsentEnabled: true };
    const { call, handlers } = setupSync({
      analyticsState: {
        optedInToMarketing: true,
        marketingConsentDecisionMade: true,
      },
      authenticationState: { isSignedIn: true },
      getConsent: () => Promise.resolve(remote),
    });
    await flushPromises();

    handlers['KeyringController:lock']();
    remote = { marketingConsentEnabled: false };
    call.mockClear();
    handlers['KeyringController:unlock']();
    await flushPromises();

    expect(call).toHaveBeenCalledWith(GET_CONSENT_ACTION);
    expect(call).toHaveBeenCalledWith(OPT_OUT_ACTION);
  });

  it('defers a refresh until an in-flight AUS write lands', async () => {
    let resolvePut: (() => void) | undefined;
    const { call, handlers, refreshMarketingConsent } = setupSync({
      analyticsState: {
        optedInToMarketing: false,
        marketingConsentDecisionMade: true,
      },
      authenticationState: { isSignedIn: true },
      remoteConsent: { marketingConsentEnabled: false },
      putConsent: () =>
        new Promise<void>((resolve) => {
          resolvePut = resolve;
        }),
    });
    await flushPromises();

    handlers['AnalyticsController:stateChange']({
      optedInToMarketing: true,
      marketingConsentDecisionMade: true,
    });
    await flushPromises();
    call.mockClear();

    refreshMarketingConsent();
    await flushPromises();
    expect(call).not.toHaveBeenCalledWith(GET_CONSENT_ACTION);

    resolvePut?.();
    await flushPromises();
    expect(call).toHaveBeenCalledWith(GET_CONSENT_ACTION);
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

  [true, false].forEach((localConsent) => {
    const remoteConsent = !localConsent;
    it(`uploads the first local decision ${localConsent} instead of applying AUS value ${remoteConsent}`, async () => {
      const { handlers, call, waitForSync } = setupSync({
        analyticsState: {
          optedInToMarketing: false,
          marketingConsentDecisionMade: false,
        },
        authenticationState: { isSignedIn: true },
        remoteConsent: { marketingConsentEnabled: remoteConsent },
      });

      handlers['AnalyticsController:stateChange']({
        optedInToMarketing: localConsent,
        marketingConsentDecisionMade: true,
      });
      await flushPromises();

      expect(call).not.toHaveBeenCalledWith(GET_CONSENT_ACTION);
      expect(call).not.toHaveBeenCalledWith(
        localConsent ? OPT_OUT_ACTION : OPT_IN_ACTION,
      );
      expect(call).toHaveBeenCalledWith(
        PUT_CONSENT_ACTION,
        { marketingConsentEnabled: localConsent },
        'extension',
      );
      await expect(waitForSync(localConsent)).resolves.toBeUndefined();
    });
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

  it('uploads the latest choice after a same-profile sign-out while a PUT fails', async () => {
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

    expect(writes).toBe(2);
    expect(
      call.mock.calls.filter(([action]) => action === PUT_CONSENT_ACTION),
    ).toEqual([
      [PUT_CONSENT_ACTION, { marketingConsentEnabled: true }, 'extension'],
      [PUT_CONSENT_ACTION, { marketingConsentEnabled: false }, 'extension'],
    ]);
    consoleError.mockRestore();
  });

  it('uploads a local choice made while signed out to the same profile', async () => {
    let remoteConsent = { marketingConsentEnabled: true };
    const { handlers, call } = setupSync({
      analyticsState: {
        optedInToMarketing: true,
        marketingConsentDecisionMade: true,
      },
      authenticationState: { isSignedIn: true },
      remoteConsent,
      getConsent: () => Promise.resolve(remoteConsent),
      putConsent: () => {
        remoteConsent = { marketingConsentEnabled: false };
        return Promise.resolve();
      },
    });
    await flushPromises();

    handlers['AuthenticationController:stateChange']({ isSignedIn: false });
    handlers['AnalyticsController:stateChange']({
      optedInToMarketing: false,
      marketingConsentDecisionMade: true,
    });
    handlers['AuthenticationController:stateChange']({ isSignedIn: true });
    await flushPromises();

    expect(call).toHaveBeenCalledWith(
      PUT_CONSENT_ACTION,
      { marketingConsentEnabled: false },
      'extension',
    );
    expect(call).not.toHaveBeenCalledWith(OPT_IN_ACTION);
  });

  it('uploads a local choice made before signing in to a different profile', async () => {
    const { handlers, call } = setupSync({
      analyticsState: {
        optedInToMarketing: true,
        marketingConsentDecisionMade: true,
      },
      authenticationState: profileAuthState(1),
      remoteConsent: { marketingConsentEnabled: true },
    });
    await flushPromises();
    call.mockClear();

    handlers['AuthenticationController:stateChange']({ isSignedIn: false });
    handlers['AnalyticsController:stateChange']({
      optedInToMarketing: false,
      marketingConsentDecisionMade: true,
    });
    handlers['AuthenticationController:stateChange'](profileAuthState(2));
    await flushPromises();

    expect(call).toHaveBeenCalledWith(
      PUT_CONSENT_ACTION,
      { marketingConsentEnabled: false },
      'extension',
    );
    expect(call).not.toHaveBeenCalledWith(GET_CONSENT_ACTION);
    expect(call).not.toHaveBeenCalledWith(OPT_IN_ACTION);
  });

  it('uploads a failed write to the next signed-in profile', async () => {
    const consoleError = jest
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
    let failPut = true;
    const { handlers, call } = setupSync({
      analyticsState: {
        optedInToMarketing: false,
        marketingConsentDecisionMade: true,
      },
      authenticationState: profileAuthState(1),
      remoteConsent: { marketingConsentEnabled: false },
      putConsent: () => {
        if (failPut) {
          failPut = false;
          return Promise.reject(new Error('profile one unavailable'));
        }
        return Promise.resolve();
      },
    });
    await flushPromises();
    handlers['AnalyticsController:stateChange']({
      optedInToMarketing: true,
      marketingConsentDecisionMade: true,
    });
    await flushPromises();
    call.mockClear();

    handlers['AuthenticationController:stateChange'](profileAuthState(2));
    await flushPromises();

    expect(call).toHaveBeenCalledWith(
      PUT_CONSENT_ACTION,
      { marketingConsentEnabled: true },
      'extension',
    );
    expect(call).not.toHaveBeenCalledWith(GET_CONSENT_ACTION);
    consoleError.mockRestore();
  });

  it('uploads a choice toggled off and back on while signed out', async () => {
    let remoteConsent = { marketingConsentEnabled: true };
    const { handlers, call } = setupSync({
      analyticsState: {
        optedInToMarketing: true,
        marketingConsentDecisionMade: true,
      },
      authenticationState: { isSignedIn: true },
      remoteConsent,
      getConsent: () => Promise.resolve(remoteConsent),
      putConsent: () => {
        remoteConsent = { marketingConsentEnabled: true };
        return Promise.resolve();
      },
    });
    await flushPromises();

    handlers['AuthenticationController:stateChange']({ isSignedIn: false });
    handlers['AnalyticsController:stateChange']({
      optedInToMarketing: false,
      marketingConsentDecisionMade: true,
    });
    handlers['AnalyticsController:stateChange']({
      optedInToMarketing: true,
      marketingConsentDecisionMade: true,
    });
    remoteConsent = { marketingConsentEnabled: false };
    handlers['AuthenticationController:stateChange']({ isSignedIn: true });
    await flushPromises();

    expect(call).toHaveBeenCalledWith(
      PUT_CONSENT_ACTION,
      { marketingConsentEnabled: true },
      'extension',
    );
    expect(call).not.toHaveBeenCalledWith(OPT_OUT_ACTION);
  });

  it('drops a failed seed instead of writing it to a different profile', async () => {
    const consoleError = jest
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
    let failPut = true;
    let remoteConsent: { marketingConsentEnabled: boolean } | null = null;
    const { handlers, call } = setupSync({
      analyticsState: {
        optedInToMarketing: true,
        marketingConsentDecisionMade: true,
      },
      authenticationState: profileAuthState(1),
      getConsent: () => Promise.resolve(remoteConsent),
      putConsent: () => {
        if (failPut) {
          failPut = false;
          return Promise.reject(new Error('profile one unavailable'));
        }
        return Promise.resolve();
      },
    });
    await flushPromises();
    call.mockClear();

    remoteConsent = { marketingConsentEnabled: false };
    handlers['AuthenticationController:stateChange'](profileAuthState(2));
    await flushPromises();

    expect(call).toHaveBeenCalledWith(GET_CONSENT_ACTION);
    expect(call).toHaveBeenCalledWith(OPT_OUT_ACTION);
    expect(call).not.toHaveBeenCalledWith(
      PUT_CONSENT_ACTION,
      { marketingConsentEnabled: true },
      'extension',
    );
    consoleError.mockRestore();
  });

  it('keeps waiting when an older session run hands off to a new run', async () => {
    let resolveFirstRead: ((consent: null) => void) | undefined;
    let readNumber = 0;
    const { handlers, waitForSync } = setupSync({
      analyticsState: {
        optedInToMarketing: true,
        marketingConsentDecisionMade: true,
      },
      authenticationState: profileAuthState(1),
      getConsent: () => {
        readNumber += 1;
        if (readNumber === 1) {
          return new Promise((resolve) => {
            resolveFirstRead = resolve;
          });
        }
        return Promise.resolve(null);
      },
    });
    await flushPromises();

    handlers['AuthenticationController:stateChange'](profileAuthState(2));
    const waiting = waitForSync(true);
    resolveFirstRead?.(null);

    await expect(waiting).resolves.toBeUndefined();
  });

  it('applies AUS consent after signing in to a different profile', async () => {
    let remoteConsent = { marketingConsentEnabled: false };
    const { handlers, call } = setupSync({
      analyticsState: {
        optedInToMarketing: false,
        marketingConsentDecisionMade: true,
      },
      authenticationState: profileAuthState(1),
      getConsent: () => Promise.resolve(remoteConsent),
    });
    await flushPromises();
    call.mockClear();

    remoteConsent = { marketingConsentEnabled: true };
    handlers['AuthenticationController:stateChange']({ isSignedIn: false });
    handlers['AuthenticationController:stateChange'](profileAuthState(2));
    await flushPromises();

    expect(call).toHaveBeenCalledWith(GET_CONSENT_ACTION);
    expect(call).toHaveBeenCalledWith(OPT_IN_ACTION);
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
    call.mockClear();

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

  describe('Updates and rewards notifications', () => {
    const signedInOptedIn = {
      analyticsState: {
        optedInToMarketing: true,
        marketingConsentDecisionMade: true,
      },
      authenticationState: { isSignedIn: true },
      remoteConsent: { marketingConsentEnabled: true },
    };

    it('turns off both marketing channels before saving a local opt-out', async () => {
      const { handlers, call } = setupSync({
        ...signedInOptedIn,
        getPreferences: () => Promise.resolve(NOTIFICATION_PREFERENCES),
      });
      await flushPromises();
      call.mockClear();

      handlers['AnalyticsController:stateChange']({
        optedInToMarketing: false,
        marketingConsentDecisionMade: true,
      });
      await flushPromises();

      const writes = call.mock.calls
        .map(([action]) => action)
        .filter((action) =>
          [
            INVALIDATE_ACTION,
            GET_PREFERENCES_ACTION,
            PUT_PREFERENCES_ACTION,
            PUT_CONSENT_ACTION,
          ].includes(action),
        );
      expect(writes).toStrictEqual([
        INVALIDATE_ACTION,
        GET_PREFERENCES_ACTION,
        PUT_PREFERENCES_ACTION,
        PUT_CONSENT_ACTION,
      ]);
      expect(call).toHaveBeenCalledWith(INVALIDATE_ACTION, {
        queryKey: [GET_PREFERENCES_ACTION],
      });
      expect(call).toHaveBeenCalledWith(
        PUT_PREFERENCES_ACTION,
        {
          ...NOTIFICATION_PREFERENCES,
          marketing: {
            pushNotificationsEnabled: false,
            inAppNotificationsEnabled: false,
          },
        },
        'extension',
      );
    });

    it('does not write preferences when both marketing channels are already off', async () => {
      const { handlers, call } = setupSync({
        ...signedInOptedIn,
        getPreferences: () =>
          Promise.resolve({
            ...NOTIFICATION_PREFERENCES,
            marketing: {
              pushNotificationsEnabled: false,
              inAppNotificationsEnabled: false,
            },
          }),
      });
      await flushPromises();

      handlers['AnalyticsController:stateChange']({
        optedInToMarketing: false,
        marketingConsentDecisionMade: true,
      });
      await flushPromises();

      expect(call).not.toHaveBeenCalledWith(
        PUT_PREFERENCES_ACTION,
        expect.anything(),
        expect.anything(),
      );
      expect(call).toHaveBeenCalledWith(
        PUT_CONSENT_ACTION,
        { marketingConsentEnabled: false },
        'extension',
      );
    });

    it('does not write preferences when the profile has none', async () => {
      const { handlers, call } = setupSync(signedInOptedIn);
      await flushPromises();

      handlers['AnalyticsController:stateChange']({
        optedInToMarketing: false,
        marketingConsentDecisionMade: true,
      });
      await flushPromises();

      expect(call).toHaveBeenCalledWith(GET_PREFERENCES_ACTION);
      expect(call).not.toHaveBeenCalledWith(
        PUT_PREFERENCES_ACTION,
        expect.anything(),
        expect.anything(),
      );
      expect(call).toHaveBeenCalledWith(
        PUT_CONSENT_ACTION,
        { marketingConsentEnabled: false },
        'extension',
      );
    });

    it('does not read preferences when saving an opt-in', async () => {
      const { handlers, call } = setupSync({
        analyticsState: {
          optedInToMarketing: false,
          marketingConsentDecisionMade: true,
        },
        authenticationState: { isSignedIn: true },
        remoteConsent: { marketingConsentEnabled: false },
        getPreferences: () => Promise.resolve(NOTIFICATION_PREFERENCES),
      });
      await flushPromises();

      handlers['AnalyticsController:stateChange']({
        optedInToMarketing: true,
        marketingConsentDecisionMade: true,
      });
      await flushPromises();

      expect(call).not.toHaveBeenCalledWith(GET_PREFERENCES_ACTION);
    });

    it('does not touch channels when applying an opt-out from AUS', async () => {
      const { call } = setupSync({
        ...signedInOptedIn,
        remoteConsent: { marketingConsentEnabled: false },
        getPreferences: () => Promise.resolve(NOTIFICATION_PREFERENCES),
      });
      await flushPromises();

      expect(call).toHaveBeenCalledWith(OPT_OUT_ACTION);
      expect(call).not.toHaveBeenCalledWith(GET_PREFERENCES_ACTION);
    });

    it('turns off channels at the next sign-in for an opt-out made while signed out', async () => {
      const { handlers, call } = setupSync({
        ...signedInOptedIn,
        getPreferences: () => Promise.resolve(NOTIFICATION_PREFERENCES),
      });
      await flushPromises();

      handlers['AuthenticationController:stateChange']({ isSignedIn: false });
      handlers['AnalyticsController:stateChange']({
        optedInToMarketing: false,
        marketingConsentDecisionMade: true,
      });
      await flushPromises();
      expect(call).not.toHaveBeenCalledWith(GET_PREFERENCES_ACTION);

      handlers['AuthenticationController:stateChange']({ isSignedIn: true });
      await flushPromises();

      expect(call).toHaveBeenCalledWith(
        PUT_PREFERENCES_ACTION,
        expect.objectContaining({
          marketing: {
            pushNotificationsEnabled: false,
            inAppNotificationsEnabled: false,
          },
        }),
        'extension',
      );
      expect(call).toHaveBeenCalledWith(
        PUT_CONSENT_ACTION,
        { marketingConsentEnabled: false },
        'extension',
      );
    });

    it('turns off channels before seeding an opted-out profile', async () => {
      const { call } = setupSync({
        analyticsState: {
          optedInToMarketing: false,
          marketingConsentDecisionMade: true,
        },
        authenticationState: { isSignedIn: true },
        remoteConsent: null,
        getPreferences: () => Promise.resolve(NOTIFICATION_PREFERENCES),
      });
      await flushPromises();

      const writes = call.mock.calls
        .map(([action]) => action)
        .filter((action) =>
          [PUT_PREFERENCES_ACTION, PUT_CONSENT_ACTION].includes(action),
        );
      expect(writes).toStrictEqual([
        PUT_PREFERENCES_ACTION,
        PUT_CONSENT_ACTION,
      ]);
    });

    it('does not write the previous profile notification preferences after a profile switch mid-read', async () => {
      const consoleError = jest
        .spyOn(console, 'error')
        .mockImplementation(() => undefined);
      const profile1Preferences: NotificationPreferences = {
        ...NOTIFICATION_PREFERENCES,
        perps: {
          pushNotificationsEnabled: true,
          inAppNotificationsEnabled: false,
        },
      };
      const profile2Preferences: NotificationPreferences = {
        ...NOTIFICATION_PREFERENCES,
        perps: {
          pushNotificationsEnabled: false,
          inAppNotificationsEnabled: true,
        },
      };
      let resolveProfile1Read: (value: NotificationPreferences) => void = () =>
        undefined;
      let reads = 0;
      const getPreferences = () => {
        reads += 1;
        return reads === 1
          ? new Promise<NotificationPreferences>((resolve) => {
              resolveProfile1Read = resolve;
            })
          : Promise.resolve(profile2Preferences);
      };
      const { handlers, call } = setupSync({
        analyticsState: {
          optedInToMarketing: true,
          marketingConsentDecisionMade: true,
        },
        authenticationState: profileAuthState(1),
        remoteConsent: { marketingConsentEnabled: true },
        getPreferences,
      });
      await flushPromises();
      call.mockClear();

      handlers['AnalyticsController:stateChange']({
        optedInToMarketing: false,
        marketingConsentDecisionMade: true,
      });
      await flushPromises();

      // Switch profiles while profile 1's preferences read is pending.
      handlers['AuthenticationController:stateChange'](profileAuthState(2));
      resolveProfile1Read(profile1Preferences);
      await flushPromises();
      await flushPromises();

      expect(
        call.mock.calls.filter(([action]) => action === PUT_PREFERENCES_ACTION),
      ).toHaveLength(1);
      expect(call).toHaveBeenCalledWith(
        PUT_PREFERENCES_ACTION,
        expect.objectContaining({
          perps: profile2Preferences.perps,
          marketing: {
            pushNotificationsEnabled: false,
            inAppNotificationsEnabled: false,
          },
        }),
        'extension',
      );
      expect(call).toHaveBeenCalledWith(
        PUT_CONSENT_ACTION,
        { marketingConsentEnabled: false },
        'extension',
      );
      expect(call).not.toHaveBeenCalledWith(OPT_IN_ACTION);
      expect(consoleError).not.toHaveBeenCalled();
      consoleError.mockRestore();
    });

    it('writes the opt-out to the new profile after a profile switch during the preferences write', async () => {
      const consoleError = jest
        .spyOn(console, 'error')
        .mockImplementation(() => undefined);
      let resolveFirstWrite: () => void = () => undefined;
      let writes = 0;
      const { handlers, call } = setupSync({
        analyticsState: {
          optedInToMarketing: true,
          marketingConsentDecisionMade: true,
        },
        authenticationState: profileAuthState(1),
        remoteConsent: { marketingConsentEnabled: true },
        getPreferences: () => Promise.resolve(NOTIFICATION_PREFERENCES),
        putPreferences: () => {
          writes += 1;
          return writes === 1
            ? new Promise<void>((resolve) => {
                resolveFirstWrite = resolve;
              })
            : Promise.resolve();
        },
      });
      await flushPromises();
      call.mockClear();

      handlers['AnalyticsController:stateChange']({
        optedInToMarketing: false,
        marketingConsentDecisionMade: true,
      });
      await flushPromises();

      // Switch profiles while profile 1's preferences write is pending.
      handlers['AuthenticationController:stateChange'](profileAuthState(2));
      resolveFirstWrite();
      await flushPromises();
      await flushPromises();

      // The old run stops before its consent write, leaving profile 1 with its
      // channels off and consent on. The new profile's run turns its channels
      // off and then saves consent once.
      expect(
        call.mock.calls.filter(([action]) => action === PUT_PREFERENCES_ACTION),
      ).toHaveLength(2);
      expect(
        call.mock.calls.filter(([action]) => action === PUT_CONSENT_ACTION),
      ).toEqual([
        [PUT_CONSENT_ACTION, { marketingConsentEnabled: false }, 'extension'],
      ]);
      expect(consoleError).not.toHaveBeenCalled();
      consoleError.mockRestore();
    });

    it('drops a seed when the profile switches before its consent write', async () => {
      const consoleError = jest
        .spyOn(console, 'error')
        .mockImplementation(() => undefined);
      let resolveConsentRead: (value: null) => void = () => undefined;
      let consentReads = 0;
      let resolveSeedPreferencesWrite: () => void = () => undefined;
      let preferencesWrites = 0;
      const { handlers, call } = setupSync({
        analyticsState: {
          optedInToMarketing: false,
          marketingConsentDecisionMade: true,
        },
        authenticationState: profileAuthState(1),
        getConsent: () => {
          consentReads += 1;
          return consentReads === 1
            ? new Promise<null>((resolve) => {
                resolveConsentRead = resolve;
              })
            : Promise.resolve({ marketingConsentEnabled: true });
        },
        getPreferences: () => Promise.resolve(NOTIFICATION_PREFERENCES),
        putPreferences: () => {
          preferencesWrites += 1;
          return preferencesWrites === 1
            ? new Promise<void>((resolve) => {
                resolveSeedPreferencesWrite = resolve;
              })
            : Promise.resolve();
        },
      });
      await flushPromises();
      // Profile 1 has no AUS record, so its local opt-out becomes a seed.
      resolveConsentRead(null);
      await flushPromises();

      handlers['AuthenticationController:stateChange'](profileAuthState(2));
      resolveSeedPreferencesWrite();
      await flushPromises();
      await flushPromises();

      // Profile 2 already has consent in AUS, so it is applied locally
      // instead of being overwritten by profile 1's seed.
      expect(call).not.toHaveBeenCalledWith(
        PUT_CONSENT_ACTION,
        expect.anything(),
        expect.anything(),
      );
      expect(call).toHaveBeenCalledWith(OPT_IN_ACTION);
      expect(consoleError).not.toHaveBeenCalled();
      consoleError.mockRestore();
    });

    it('keeps the opt-out pending and skips the consent write when the preferences read fails', async () => {
      const consoleError = jest
        .spyOn(console, 'error')
        .mockImplementation(() => undefined);
      const { handlers, call, waitForSync } = setupSync({
        ...signedInOptedIn,
        getPreferences: () => Promise.reject(new Error('AUS unavailable')),
      });
      await flushPromises();

      handlers['AnalyticsController:stateChange']({
        optedInToMarketing: false,
        marketingConsentDecisionMade: true,
      });

      await expect(waitForSync(false)).rejects.toThrow('AUS unavailable');
      expect(call).not.toHaveBeenCalledWith(
        PUT_CONSENT_ACTION,
        { marketingConsentEnabled: false },
        'extension',
      );
      consoleError.mockRestore();
    });

    it('keeps the opt-out pending and skips the consent write when the channel write fails', async () => {
      let failPreferences = true;
      const consoleError = jest
        .spyOn(console, 'error')
        .mockImplementation(() => undefined);
      const { handlers, call, waitForSync } = setupSync({
        ...signedInOptedIn,
        getPreferences: () => Promise.resolve(NOTIFICATION_PREFERENCES),
        putPreferences: () => {
          if (failPreferences) {
            failPreferences = false;
            return Promise.reject(new Error('AUS unavailable'));
          }
          return Promise.resolve();
        },
      });
      await flushPromises();

      handlers['AnalyticsController:stateChange']({
        optedInToMarketing: false,
        marketingConsentDecisionMade: true,
      });
      await expect(waitForSync(false)).rejects.toThrow('AUS unavailable');
      expect(call).not.toHaveBeenCalledWith(
        PUT_CONSENT_ACTION,
        { marketingConsentEnabled: false },
        'extension',
      );

      await waitForSync(false);

      expect(
        call.mock.calls.filter(([action]) => action === PUT_PREFERENCES_ACTION),
      ).toHaveLength(2);
      expect(call).toHaveBeenCalledWith(
        PUT_CONSENT_ACTION,
        { marketingConsentEnabled: false },
        'extension',
      );
      consoleError.mockRestore();
    });
  });

  it('invalidates cached AUS consent when the signed-in profile changes', async () => {
    const { handlers, call } = setupSync({
      analyticsState: {
        optedInToMarketing: true,
        marketingConsentDecisionMade: true,
      },
      authenticationState: profileAuthState(1),
      remoteConsent: { marketingConsentEnabled: true },
    });
    await flushPromises();
    call.mockClear();

    handlers['AuthenticationController:stateChange'](profileAuthState(2));
    await flushPromises();

    expect(call).toHaveBeenCalledWith(INVALIDATE_ACTION, {
      queryKey: [GET_CONSENT_ACTION],
    });
    expect(call).toHaveBeenCalledWith(GET_CONSENT_ACTION);
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

  it('retries a failed AUS seed without re-reading AUS', async () => {
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
    ).toHaveLength(1);
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
      authenticationState: profileAuthState(1),
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
    handlers['AuthenticationController:stateChange'](profileAuthState(2));
    resolveFirstRead?.({ marketingConsentEnabled: false });
    await flushPromises();
    await flushPromises();

    expect(call).not.toHaveBeenCalledWith(OPT_OUT_ACTION);
    expect(
      call.mock.calls.filter(([action]) => action === GET_CONSENT_ACTION),
    ).toHaveLength(2);
    expect(call).not.toHaveBeenCalledWith(PUT_CONSENT_ACTION);
  });

  it('uploads the latest first-decision preference made before sign-in', async () => {
    let remoteConsent = { marketingConsentEnabled: true };
    const { call, handlers } = setupSync({
      analyticsState: {
        optedInToMarketing: false,
        marketingConsentDecisionMade: false,
      },
      authenticationState: { isSignedIn: false },
      remoteConsent,
      getConsent: () => Promise.resolve(remoteConsent),
      putConsent: () => {
        remoteConsent = { marketingConsentEnabled: false };
        return Promise.resolve();
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
    await flushPromises();

    expect(call).not.toHaveBeenCalledWith(PUT_CONSENT_ACTION);

    handlers['AuthenticationController:stateChange']({ isSignedIn: true });
    await flushPromises();

    expect(call).toHaveBeenCalledWith(
      PUT_CONSENT_ACTION,
      { marketingConsentEnabled: false },
      'extension',
    );
    expect(call).not.toHaveBeenCalledWith(GET_CONSENT_ACTION);

    handlers['KeyringController:lock']();
    handlers['KeyringController:unlock']();
    await flushPromises();

    expect(call).not.toHaveBeenCalledWith(OPT_IN_ACTION);
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
