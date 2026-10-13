import type {
  AuthenticatedUserStorageInvalidateQueriesAction,
  AuthenticatedUserStorageServiceGetMarketingConsentAction,
  AuthenticatedUserStorageServiceGetNotificationPreferencesAction,
  AuthenticatedUserStorageServicePutMarketingConsentAction,
  AuthenticatedUserStorageServicePutNotificationPreferencesAction,
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
  StorageServiceGetItemAction,
  StorageServiceRemoveItemAction,
  StorageServiceSetItemAction,
} from '@metamask/storage-service';
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

export type MarketingConsentSyncWaitForMarketingConsentSyncAction = {
  type: 'MarketingConsentSync:waitForMarketingConsentSync';
  handler: (expectedConsent: boolean) => Promise<void>;
};

type SyncActions =
  | AuthenticatedUserStorageInvalidateQueriesAction
  | AuthenticatedUserStorageServiceGetMarketingConsentAction
  | AuthenticatedUserStorageServicePutMarketingConsentAction
  | AuthenticatedUserStorageServiceGetNotificationPreferencesAction
  | AuthenticatedUserStorageServicePutNotificationPreferencesAction
  | AnalyticsControllerGetStateAction
  | AnalyticsControllerOptInToMarketingAction
  | AnalyticsControllerOptOutOfMarketingAction
  | AuthenticationControllerGetStateAction
  | KeyringControllerGetStateAction
  | StorageServiceGetItemAction
  | StorageServiceRemoveItemAction
  | StorageServiceSetItemAction
  | MarketingConsentSyncWaitForMarketingConsentSyncAction;

type SyncEvents =
  | AnalyticsControllerStateChangeEvent
  | AuthenticationControllerStateChangeEvent
  | KeyringControllerLockEvent
  | KeyringControllerUnlockEvent;

type SyncMessenger = RootMessenger<SyncActions, SyncEvents>;

const STORAGE_NAMESPACE = 'MarketingConsentSync';
const PENDING_CONSENT_KEY = 'pendingConsent';

type ConsentSyncSession = {
  lastSynced?: boolean;
  // AUS may have changed on another device since the last read.
  remoteStale?: boolean;
};

export type MarketingConsentSync = {
  /** Confirms the requested consent was saved to AUS. */
  waitForMarketingConsentSync: (expectedConsent: boolean) => Promise<void>;
  /** Re-reads consent from AUS, e.g. when the wallet UI opens. */
  refreshMarketingConsent: () => void;
};

function canReachAus(
  authenticationState: Pick<AuthenticationControllerState, 'isSignedIn'>,
  keyringState: Pick<KeyringControllerState, 'isUnlocked'>,
): boolean {
  // AUS consent reads require a bearer token, which is only obtainable while
  // the vault is unlocked, so a sync attempted while locked always fails.
  return (
    keyringState.isUnlocked === true && authenticationState.isSignedIn === true
  );
}

/**
 * Confirm AUS recorded the requested consent in the same signed-in session.
 *
 * @param expectedConsent - The consent value the caller asked to save.
 * @param expectedSession - The session captured when the caller started waiting.
 * @param session - The session that applies when the wait finishes.
 * @param pendingConsentUpdate - The local change not yet written to AUS.
 * @param analyticsState - The local analytics state after the wait.
 */
function assertMarketingConsentSynced(
  expectedConsent: boolean,
  expectedSession: ConsentSyncSession,
  session: ConsentSyncSession,
  pendingConsentUpdate: boolean | undefined,
  analyticsState: Pick<
    AnalyticsControllerState,
    'optedInToMarketing' | 'marketingConsentDecisionMade'
  >,
): void {
  if (
    expectedSession !== session ||
    pendingConsentUpdate !== undefined ||
    session.lastSynced !== expectedConsent ||
    analyticsState.marketingConsentDecisionMade !== true ||
    analyticsState.optedInToMarketing !== expectedConsent
  ) {
    throw new Error('Marketing consent was not saved to AUS');
  }
}

/**
 * Keep marketing consent in sync with the signed-in user's AUS profile. A
 * client with no local decision adopts the profile's saved one, if any.
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
      'AuthenticatedUserStorageService:getNotificationPreferences',
      'AuthenticatedUserStorageService:putNotificationPreferences',
      'AnalyticsController:getState',
      'AnalyticsController:optInToMarketing',
      'AnalyticsController:optOutOfMarketing',
      'AuthenticationController:getState',
      'KeyringController:getState',
      'StorageService:getItem',
      'StorageService:removeItem',
      'StorageService:setItem',
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
  // Outlives the signed-in session and is persisted, so a local change is
  // never dropped, only written to whichever profile is signed in next.
  let pendingConsentUpdate: boolean | undefined;
  let session: ConsentSyncSession = {};
  let applyingRemote: { value: boolean } | undefined;
  let inFlight: Promise<void> | undefined;

  const isAusReachable = () => canReachAus(authenticationState, keyringState);
  const isDecided = () => analyticsState.marketingConsentDecisionMade === true;
  const isReady = () => isAusReachable() && isDecided();

  const persistPendingConsentUpdate = (value: boolean | undefined) => {
    const write =
      value === undefined
        ? syncMessenger.call(
            'StorageService:removeItem',
            STORAGE_NAMESPACE,
            PENDING_CONSENT_KEY,
          )
        : syncMessenger.call(
            'StorageService:setItem',
            STORAGE_NAMESPACE,
            PENDING_CONSENT_KEY,
            value,
          );
    write.catch((error) => {
      console.error('Failed to persist pending marketing consent:', error);
    });
  };

  const restorePendingConsentUpdate = async () => {
    try {
      const { result, error } = await syncMessenger.call(
        'StorageService:getItem',
        STORAGE_NAMESPACE,
        PENDING_CONSENT_KEY,
      );
      if (error) {
        throw error;
      }
      if (typeof result === 'boolean') {
        pendingConsentUpdate ??= result;
      }
    } catch (error) {
      console.error('Failed to restore pending marketing consent:', error);
    }
  };
  const pendingConsentRestored = restorePendingConsentUpdate();

  // Updates and rewards notifications rely on marketing consent.
  const turnOffMarketingNotifications = async (): Promise<void> => {
    await syncMessenger.call(
      'AuthenticatedUserStorageService:invalidateQueries',
      {
        queryKey: [
          'AuthenticatedUserStorageService:getNotificationPreferences',
        ],
      },
    );
    const preferences = await syncMessenger.call(
      'AuthenticatedUserStorageService:getNotificationPreferences',
    );
    const marketing = preferences?.marketing;
    if (
      !preferences ||
      (!marketing?.pushNotificationsEnabled &&
        !marketing?.inAppNotificationsEnabled)
    ) {
      return;
    }

    await syncMessenger.call(
      'AuthenticatedUserStorageService:putNotificationPreferences',
      {
        ...preferences,
        marketing: {
          ...marketing,
          pushNotificationsEnabled: false,
          inAppNotificationsEnabled: false,
        },
      },
      'extension',
    );
  };

  // Channels go off before consent so AUS never has consent off with a
  // channel on; a failure leaves both to retry.
  const writeConsent = async (value: boolean): Promise<void> => {
    if (!value) {
      await turnOffMarketingNotifications();
    }
    await syncMessenger.call(
      'AuthenticatedUserStorageService:putMarketingConsent',
      { marketingConsentEnabled: value },
      'extension',
    );
  };

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

    if (currentSession !== session || !isAusReachable()) {
      return;
    }

    // A local change during the read takes precedence over AUS.
    if (pendingConsentUpdate !== undefined) {
      return;
    }

    const decided = isDecided();

    if (remote === null) {
      // Without a local decision there is nothing to seed AUS with; the user
      // is asked, and that decision is written as a local change.
      if (decided) {
        await writeConsent(localValue);
        currentSession.lastSynced = localValue;
      }
      return;
    }

    // An undecided client (e.g. a social-login restore on a new device)
    // adopts the profile's saved decision.
    if (!decided || remote.marketingConsentEnabled !== localValue) {
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

    currentSession.lastSynced = remote.marketingConsentEnabled;
  };

  const flushPendingConsentUpdate = async (
    currentSession: typeof session,
  ): Promise<void> => {
    if (pendingConsentUpdate === undefined || !isReady()) {
      return;
    }

    const value = pendingConsentUpdate;
    pendingConsentUpdate = undefined;

    try {
      await writeConsent(value);
    } catch (error) {
      pendingConsentUpdate ??= value;
      throw error;
    }

    currentSession.lastSynced = value;
    if (pendingConsentUpdate === undefined) {
      persistPendingConsentUpdate(undefined);
    }

    return flushPendingConsentUpdate(currentSession);
  };

  const run = async (currentSession: typeof session) => {
    await pendingConsentRestored;

    if (pendingConsentUpdate !== undefined) {
      currentSession.remoteStale = false;
    }

    if (
      pendingConsentUpdate === undefined &&
      (currentSession.lastSynced === undefined ||
        currentSession.remoteStale === true)
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

    if (!isAusReachable()) {
      return Promise.resolve();
    }

    const startedFor = session;

    inFlight = run(startedFor).finally(() => {
      inFlight = undefined;
      // Re-run for a new session, or for a refresh requested mid-run; a
      // refresh must not read AUS before an in-flight write has landed.
      if (
        isAusReachable() &&
        (session !== startedFor || session.remoteStale)
      ) {
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
    // AUS may have changed on another device while locked.
    refreshMarketingConsent();
  });

  syncMessenger.subscribe('KeyringController:lock', () => {
    keyringState = { ...keyringState, isUnlocked: false };
  });

  syncMessenger.subscribe(
    'AuthenticationController:stateChange',
    (state: AuthenticationControllerState) => {
      const changed = authenticationState.isSignedIn !== state.isSignedIn;

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
      const decisionJustMade =
        !priorDecided &&
        nowDecided &&
        applyingRemote?.value !== state.optedInToMarketing;

      if (!localConsentChanged && !decisionJustMade) {
        return;
      }

      pendingConsentUpdate = state.optedInToMarketing === true;
      persistPendingConsentUpdate(pendingConsentUpdate);

      startSync();
    },
  );

  startSync();

  // A run for an older session hands off to a new run when it settles.
  const settleSync = async (): Promise<void> => {
    await sync();
    if (inFlight) {
      await settleSync();
    }
  };

  const waitForMarketingConsentSync = async (expectedConsent: boolean) => {
    // A skipped sync must not be reported as a successful save.
    if (!isReady()) {
      throw new Error(
        'Marketing consent requires an unlocked, signed-in wallet',
      );
    }
    const currentSession = session;
    await settleSync();
    assertMarketingConsentSynced(
      expectedConsent,
      currentSession,
      session,
      pendingConsentUpdate,
      analyticsState,
    );
  };

  syncMessenger.registerActionHandler(
    'MarketingConsentSync:waitForMarketingConsentSync',
    waitForMarketingConsentSync,
  );

  return { waitForMarketingConsentSync, refreshMarketingConsent };
}
