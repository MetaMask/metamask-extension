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
  AuthenticationControllerGetStateAction,
  AuthenticationControllerState,
  AuthenticationControllerStateChangeEvent,
} from '@metamask/profile-sync-controller/auth';
import type { MetaMetricsControllerGetStateAction } from '../controllers/metametrics-controller';
import type { MetaMetricsControllerSetMarketingCampaignCookieIdAction } from '../controllers/metametrics-controller-method-action-types';
import type { RootMessenger } from '../lib/messenger';

type SyncActions =
  | AuthenticatedUserStorageInvalidateQueriesAction
  | AuthenticatedUserStorageServiceGetMarketingConsentAction
  | AuthenticatedUserStorageServicePutMarketingConsentAction
  | AnalyticsControllerGetStateAction
  | AnalyticsControllerOptInToMarketingAction
  | AnalyticsControllerOptOutOfMarketingAction
  | AuthenticationControllerGetStateAction
  | MetaMetricsControllerGetStateAction
  | MetaMetricsControllerSetMarketingCampaignCookieIdAction;

type SyncEvents =
  | AnalyticsControllerStateChangeEvent
  | AuthenticationControllerStateChangeEvent;

type SyncMessenger = RootMessenger<SyncActions, SyncEvents>;

/**
 * Keep decided marketing consent in sync with the signed-in user's AUS profile.
 *
 * @param options - Setup options.
 * @param options.messenger - The root controller messenger.
 * @returns A function that confirms the requested consent was saved to AUS.
 */
export function setupMarketingConsentSync({
  messenger,
}: {
  messenger: SyncMessenger;
}): (expectedConsent: boolean) => Promise<void> {
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
      'MetaMetricsController:getState',
      'MetaMetricsController:setMarketingCampaignCookieId',
    ],
    events: [
      'AnalyticsController:stateChange',
      'AuthenticationController:stateChange',
    ],
  });

  let analyticsState = syncMessenger.call('AnalyticsController:getState');
  let authenticationState = syncMessenger.call(
    'AuthenticationController:getState',
  );
  let generation = 0;
  let revision = 0;
  let lastSynced: boolean | undefined;
  let pending: boolean | undefined;
  let applyingRemote: boolean | undefined;
  let inFlight: Promise<void> | undefined;

  const isReady = () =>
    authenticationState.isSignedIn === true &&
    analyticsState.marketingConsentDecisionMade === true;
  const profileId = (state: AuthenticationControllerState) =>
    Object.values(state.srpSessionData ?? {})[0]?.profile?.canonicalProfileId ??
    '';

  const run = async () => {
    const session = generation;
    const readRevision = revision;
    const localValue = analyticsState.optedInToMarketing === true;

    if (lastSynced === undefined) {
      await syncMessenger.call(
        'AuthenticatedUserStorageService:invalidateQueries',
        { queryKey: ['AuthenticatedUserStorageService:getMarketingConsent'] },
      );
      if (session !== generation || !isReady()) {
        return;
      }
      const remote = await syncMessenger.call(
        'AuthenticatedUserStorageService:getMarketingConsent',
      );
      if (session !== generation || !isReady()) {
        return;
      }

      if (readRevision !== revision) {
        // Only decisions made after the read started override its result.
        pending = analyticsState.optedInToMarketing === true;
      } else if (remote === null) {
        pending = localValue;
      } else {
        pending = undefined;
        if (remote.marketingConsentEnabled !== localValue) {
          applyingRemote = remote.marketingConsentEnabled;
          try {
            if (remote.marketingConsentEnabled) {
              await syncMessenger.call('AnalyticsController:optInToMarketing');
            } else {
              syncMessenger.call('AnalyticsController:optOutOfMarketing');
              const { marketingCampaignCookieId } = syncMessenger.call(
                'MetaMetricsController:getState',
              );
              if (marketingCampaignCookieId) {
                syncMessenger.call(
                  'MetaMetricsController:setMarketingCampaignCookieId',
                  null,
                );
              }
            }
          } finally {
            applyingRemote = undefined;
          }
        }
        if (session !== generation || !isReady()) {
          return;
        }
        lastSynced = remote.marketingConsentEnabled;
      }
    }

    while (pending !== undefined) {
      if (session !== generation || !isReady()) {
        return;
      }
      const value = pending;
      pending = undefined;
      if (value === lastSynced) {
        continue;
      }
      try {
        await syncMessenger.call(
          'AuthenticatedUserStorageService:putMarketingConsent',
          { marketingConsentEnabled: value },
          'extension',
        );
      } catch (error) {
        if (session === generation) {
          pending ??= value;
        }
        throw error;
      }
      if (session === generation) {
        lastSynced = value;
      }
    }
  };

  const sync = (): Promise<void> => {
    if (inFlight) {
      return inFlight;
    }
    if (!isReady()) {
      return Promise.resolve();
    }
    const startedFor = generation;
    inFlight = run().finally(() => {
      inFlight = undefined;
      if (isReady() && generation !== startedFor) {
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

  syncMessenger.subscribe(
    'AuthenticationController:stateChange',
    (state: AuthenticationControllerState) => {
      const changed =
        authenticationState.isSignedIn !== state.isSignedIn ||
        profileId(authenticationState) !== profileId(state);
      authenticationState = state;
      if (changed) {
        generation += 1;
        lastSynced = undefined;
        pending = undefined;
        startSync();
      }
    },
  );

  syncMessenger.subscribe(
    'AnalyticsController:stateChange',
    (state: AnalyticsControllerState) => {
      const prior = analyticsState;
      analyticsState = state;
      if (prior.optedInToMarketing !== state.optedInToMarketing) {
        revision += 1;
        if (
          applyingRemote !== state.optedInToMarketing &&
          state.marketingConsentDecisionMade === true &&
          prior.marketingConsentDecisionMade === true
        ) {
          pending = state.optedInToMarketing === true;
          startSync();
        }
      }
      if (
        prior.marketingConsentDecisionMade !== true &&
        state.marketingConsentDecisionMade === true
      ) {
        startSync();
      }
    },
  );

  startSync();
  return async (expectedConsent: boolean) => {
    if (!isReady()) {
      throw new Error('Marketing consent requires a signed-in wallet');
    }
    const session = generation;
    await sync();
    if (
      session !== generation ||
      !isReady() ||
      pending !== undefined ||
      lastSynced !== expectedConsent ||
      analyticsState.optedInToMarketing !== expectedConsent
    ) {
      throw new Error('Marketing consent was not saved to AUS');
    }
  };
}
