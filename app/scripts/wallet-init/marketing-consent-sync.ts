import type {
  AuthenticatedUserStorageInvalidateQueriesAction,
  AuthenticatedUserStorageServiceGetMarketingConsentAction,
  AuthenticatedUserStorageServicePutMarketingConsentAction,
} from '@metamask/authenticated-user-storage';
import type {
  AnalyticsControllerGetStateAction,
  AnalyticsControllerOptInToMarketingAction,
  AnalyticsControllerOptOutOfMarketingAction,
  AnalyticsControllerState,
  AnalyticsControllerStateChangeEvent,
} from '@metamask/analytics-controller';
import { Messenger } from '@metamask/messenger';
import type {
  KeyringControllerGetStateAction,
  KeyringControllerLockEvent,
  KeyringControllerState,
  KeyringControllerUnlockEvent,
} from '@metamask/keyring-controller';
import type {
  AuthenticationControllerGetStateAction,
  AuthenticationControllerState,
  AuthenticationControllerStateChangeEvent,
} from '@metamask/profile-sync-controller/auth';
import type { RootMessenger } from '../lib/messenger';

type SyncActions =
  | AuthenticatedUserStorageInvalidateQueriesAction
  | AuthenticatedUserStorageServiceGetMarketingConsentAction
  | AuthenticatedUserStorageServicePutMarketingConsentAction
  | AnalyticsControllerGetStateAction
  | AnalyticsControllerOptInToMarketingAction
  | AnalyticsControllerOptOutOfMarketingAction
  | AuthenticationControllerGetStateAction
  | KeyringControllerGetStateAction
  | {
      type: 'MarketingConsentSync:waitForMarketingConsentSync';
      handler: (expectedConsent: boolean) => Promise<void>;
    };

type SyncEvents =
  | AnalyticsControllerStateChangeEvent
  | AuthenticationControllerStateChangeEvent
  | KeyringControllerLockEvent
  | KeyringControllerUnlockEvent;

type SyncMessenger = RootMessenger<SyncActions, SyncEvents>;

type ConsentSyncSession = {
  lastSynced?: boolean;
  pendingConsentUpdate?: { value: boolean };
  // AUS may have changed on another device since the last read.
  remoteStale?: boolean;
};

export type MarketingConsentSync = {
  /** Confirms the requested consent was saved to AUS. */
  waitForMarketingConsentSync: (expectedConsent: boolean) => Promise<void>;
  /** Re-reads consent from AUS, e.g. when the wallet UI opens. */
  refreshMarketingConsent: () => void;
};

function isConsentSyncReady(
  authenticationState: Pick<AuthenticationControllerState, 'isSignedIn'>,
  analyticsState: Pick<
    AnalyticsControllerState,
    'marketingConsentDecisionMade'
  >,
  keyringState: Pick<KeyringControllerState, 'isUnlocked'>,
): boolean {
  // AUS consent reads require a bearer token, which is only obtainable while
  // the vault is unlocked, so a sync attempted while locked always fails.
  return (
    keyringState.isUnlocked === true &&
    authenticationState.isSignedIn === true &&
    analyticsState.marketingConsentDecisionMade === true
  );
}

/**
 * Confirm AUS recorded the requested consent in the same signed-in session.
 *
 * @param expectedConsent - The consent value the caller asked to save.
 * @param expectedSession - The session captured when the caller started waiting.
 * @param session - The session that applies when the wait finishes.
 * @param analyticsState - The local analytics state after the wait.
 */
function assertMarketingConsentSynced(
  expectedConsent: boolean,
  expectedSession: ConsentSyncSession,
  session: ConsentSyncSession,
  analyticsState: Pick<
    AnalyticsControllerState,
    'optedInToMarketing' | 'marketingConsentDecisionMade'
  >,
): void {
  if (
    expectedSession !== session ||
    session.pendingConsentUpdate !== undefined ||
    session.lastSynced !== expectedConsent ||
    analyticsState.marketingConsentDecisionMade !== true ||
    analyticsState.optedInToMarketing !== expectedConsent
  ) {
    throw new Error('Marketing consent was not saved to AUS');
  }
}

function getCanonicalProfileId(
  srpSessionData: AuthenticationControllerState['srpSessionData'],
): string {
  return (
    Object.entries(srpSessionData ?? {})[0]?.[1]?.profile?.canonicalProfileId ??
    ''
  );
}

/**
 * Keep decided marketing consent in sync with the signed-in user's AUS profile.
 *
 * @param options - Setup options.
 * @param options.messenger - The root controller messenger.
 * @returns Functions to await a consent save and to re-read AUS consent.
 */
export function setupMarketingConsentSync({
  messenger,
}: {
  messenger: SyncMessenger;
}): MarketingConsentSync {
  const syncMessenger = new Messenger<
    'MarketingConsentSync',
    SyncActions,
    SyncEvents,
    SyncMessenger
  >({ namespace: 'MarketingConsentSync', parent: messenger });

  messenger.delegate({
    messenger: syncMessenger,
    actions: [
      'AuthenticatedUserStorageService:invalidateQueries',
      'AuthenticatedUserStorageService:getMarketingConsent',
      'AuthenticatedUserStorageService:putMarketingConsent',
      'AnalyticsController:getState',
      'AnalyticsController:optInToMarketing',
      'AnalyticsController:optOutOfMarketing',
      'AuthenticationController:getState',
      'KeyringController:getState',
    ],
    events: [
      'AnalyticsController:stateChange',
      'AuthenticationController:stateChange',
      'KeyringController:lock',
      'KeyringController:unlock',
    ],
  });

  let analyticsState = syncMessenger.call('AnalyticsController:getState');
  let authenticationState = syncMessenger.call(
    'AuthenticationController:getState',
  );
  let keyringState = syncMessenger.call('KeyringController:getState');
  let session: ConsentSyncSession = {};
  let applyingRemote: { value: boolean } | undefined;
  let inFlight: Promise<void> | undefined;

  const isReady = () =>
    isConsentSyncReady(authenticationState, analyticsState, keyringState);

  const reconcileWithAus = async (
    currentSession: typeof session,
  ): Promise<void> => {
    const localValue = analyticsState.optedInToMarketing === true;

    // AUS caches this query across profiles, so fetch fresh consent per session.
    await syncMessenger.call(
      'AuthenticatedUserStorageService:invalidateQueries',
      { queryKey: ['AuthenticatedUserStorageService:getMarketingConsent'] },
    );

    const remote = await syncMessenger.call(
      'AuthenticatedUserStorageService:getMarketingConsent',
    );

    if (currentSession !== session || !isReady()) {
      return;
    }

    // A local change during the read takes precedence over AUS.
    if (currentSession.pendingConsentUpdate !== undefined) {
      return;
    }

    if (remote === null) {
      currentSession.pendingConsentUpdate = { value: localValue };
      return;
    }

    if (remote.marketingConsentEnabled !== localValue) {
      applyingRemote = { value: remote.marketingConsentEnabled };
      try {
        if (remote.marketingConsentEnabled) {
          await syncMessenger.call('AnalyticsController:optInToMarketing');
        } else {
          syncMessenger.call('AnalyticsController:optOutOfMarketing');
        }
      } finally {
        applyingRemote = undefined;
      }
    }

    if (currentSession === session && isReady()) {
      currentSession.lastSynced = remote.marketingConsentEnabled;
    }
  };

  const flushPendingConsentUpdate = async (
    currentSession: typeof session,
  ): Promise<void> => {
    while (currentSession.pendingConsentUpdate !== undefined) {
      if (currentSession !== session || !isReady()) {
        return;
      }

      const { value } = currentSession.pendingConsentUpdate;
      currentSession.pendingConsentUpdate = undefined;

      if (value === currentSession.lastSynced) {
        continue;
      }

      try {
        await syncMessenger.call(
          'AuthenticatedUserStorageService:putMarketingConsent',
          { marketingConsentEnabled: value },
          'extension',
        );
      } catch (error) {
        if (currentSession === session) {
          currentSession.pendingConsentUpdate ??= { value };
        }
        throw error;
      }

      if (currentSession === session) {
        currentSession.lastSynced = value;
      }
    }
  };

  const run = async (currentSession: typeof session) => {
    if (
      currentSession.lastSynced === undefined ||
      currentSession.remoteStale === true
    ) {
      currentSession.remoteStale = false;
      await reconcileWithAus(currentSession);
    }

    await flushPendingConsentUpdate(currentSession);
  };

  const sync = (): Promise<void> => {
    if (inFlight) {
      return inFlight;
    }

    if (!isReady()) {
      return Promise.resolve();
    }

    const startedFor = session;

    inFlight = run(startedFor).finally(() => {
      inFlight = undefined;
      // Re-run for a new session, or for a refresh requested mid-run; a
      // refresh must not read AUS before an in-flight write has landed.
      if (isReady() && (session !== startedFor || session.remoteStale)) {
        startSync();
      }
    });

    return inFlight;
  };

  function startSync() {
    sync().catch((error) => {
      console.error('Failed to synchronize marketing consent with AUS:', error);
    });
  }

  const refreshMarketingConsent = () => {
    session.remoteStale = true;
    startSync();
  };

  syncMessenger.subscribe('KeyringController:unlock', () => {
    keyringState = { ...keyringState, isUnlocked: true };
    // Sign-in persists across restarts and AUS may have changed on another
    // device while locked, so re-read AUS on every unlock.
    refreshMarketingConsent();
  });

  syncMessenger.subscribe('KeyringController:lock', () => {
    keyringState = { ...keyringState, isUnlocked: false };
  });

  syncMessenger.subscribe(
    'AuthenticationController:stateChange',
    (state: AuthenticationControllerState) => {
      const changed =
        authenticationState.isSignedIn !== state.isSignedIn ||
        getCanonicalProfileId(authenticationState.srpSessionData) !==
          getCanonicalProfileId(state.srpSessionData);

      authenticationState = state;

      if (changed) {
        session = {};
        startSync();
      }
    },
  );

  syncMessenger.subscribe(
    'AnalyticsController:stateChange',
    (state: AnalyticsControllerState) => {
      const prior = analyticsState;
      analyticsState = state;

      const priorDecided = prior.marketingConsentDecisionMade === true;
      const nowDecided = state.marketingConsentDecisionMade === true;
      const consentChanged =
        prior.optedInToMarketing !== state.optedInToMarketing;
      const localConsentChanged =
        consentChanged &&
        priorDecided &&
        nowDecided &&
        applyingRemote?.value !== state.optedInToMarketing;
      const decisionJustMade = !priorDecided && nowDecided;

      if (!localConsentChanged && !decisionJustMade) {
        return;
      }

      if (localConsentChanged) {
        session.pendingConsentUpdate = {
          value: state.optedInToMarketing === true,
        };
      }

      startSync();
    },
  );

  startSync();

  const waitForMarketingConsentSync = async (expectedConsent: boolean) => {
    // A skipped sync must not be reported as a successful save.
    if (!isReady()) {
      throw new Error(
        'Marketing consent requires an unlocked, signed-in wallet',
      );
    }
    const currentSession = session;
    await sync();
    assertMarketingConsentSynced(
      expectedConsent,
      currentSession,
      session,
      analyticsState,
    );
  };

  syncMessenger.registerActionHandler(
    'MarketingConsentSync:waitForMarketingConsentSync',
    waitForMarketingConsentSync,
  );

  return { waitForMarketingConsentSync, refreshMarketingConsent };
}
