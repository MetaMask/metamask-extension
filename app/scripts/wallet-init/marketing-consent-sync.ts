import type {
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
import { RootMessenger } from '../lib/messenger';

type MarketingConsentSyncActions =
  | AuthenticatedUserStorageServiceGetMarketingConsentAction
  | AuthenticatedUserStorageServicePutMarketingConsentAction
  | AnalyticsControllerGetStateAction
  | AnalyticsControllerOptInToMarketingAction
  | AnalyticsControllerOptOutOfMarketingAction
  | AuthenticationControllerGetStateAction;

type MarketingConsentSyncEvents =
  | AnalyticsControllerStateChangeEvent
  | AuthenticationControllerStateChangeEvent;

type MarketingConsentSyncParentMessenger = RootMessenger<
  MarketingConsentSyncActions,
  MarketingConsentSyncEvents
>;

type MarketingConsent = {
  marketingConsentEnabled: boolean;
};

/**
 * Synchronize a signed-in user's decided local marketing consent with AUS.
 * AUS is authoritative when a value exists; a missing AUS value is initialized
 * from the local decision.
 *
 * @param options - Options bag.
 * @param options.messenger - Root messenger used to access controller state,
 * actions, and AUS.
 */
export function setupMarketingConsentSync({
  messenger,
}: {
  messenger: MarketingConsentSyncParentMessenger;
}): void {
  const syncMessenger = new Messenger<
    'MarketingConsentSync',
    MarketingConsentSyncActions,
    MarketingConsentSyncEvents,
    MarketingConsentSyncParentMessenger
  >({
    namespace: 'MarketingConsentSync',
    parent: messenger,
  });

  messenger.delegate({
    messenger: syncMessenger,
    actions: [
      'AuthenticatedUserStorageService:getMarketingConsent',
      'AuthenticatedUserStorageService:putMarketingConsent',
      'AnalyticsController:getState',
      'AnalyticsController:optInToMarketing',
      'AnalyticsController:optOutOfMarketing',
      'AuthenticationController:getState',
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
  let reconciledGeneration = -1;
  let reconciliationInFlight = false;
  let consentRevision = 0;
  let applyingRemoteConsent: boolean | undefined;
  let queuedConsent: { value: boolean; generation: number } | undefined;
  let putInFlight = false;
  let lastSyncedConsent: boolean | undefined;

  const isReady = () =>
    authenticationState.isSignedIn === true &&
    analyticsState.marketingConsentDecisionMade === true;

  const getProfileId = (state: AuthenticationControllerState) =>
    Object.values(state.srpSessionData ?? {})[0]?.profile?.canonicalProfileId ??
    '';

  const queueConsentWrite = (
    value: boolean,
    currentGeneration = generation,
  ) => {
    queuedConsent = { value, generation: currentGeneration };
    if (putInFlight) {
      return;
    }

    putInFlight = true;
    const writeLatestConsent = async () => {
      while (queuedConsent) {
        const nextWrite = queuedConsent;
        queuedConsent = undefined;

        if (
          nextWrite.generation !== generation ||
          !isReady() ||
          nextWrite.value === lastSyncedConsent
        ) {
          continue;
        }

        try {
          await syncMessenger.call(
            'AuthenticatedUserStorageService:putMarketingConsent',
            {
              marketingConsentEnabled: nextWrite.value,
            } satisfies MarketingConsent,
            'extension',
          );
          if (nextWrite.generation === generation) {
            lastSyncedConsent = nextWrite.value;
          }
        } catch (error) {
          console.error(
            'Failed to synchronize marketing consent with AUS:',
            error,
          );
        }
      }
      putInFlight = false;
    };

    writeLatestConsent().then(() => undefined);
  };

  const reconcile = async () => {
    if (
      !isReady() ||
      reconciledGeneration === generation ||
      reconciliationInFlight
    ) {
      return;
    }

    reconciliationInFlight = true;
    const currentGeneration = generation;
    const currentConsentRevision = consentRevision;
    const consentAtStart = analyticsState.optedInToMarketing === true;
    try {
      const remoteConsent = await syncMessenger.call(
        'AuthenticatedUserStorageService:getMarketingConsent',
      );

      if (currentGeneration !== generation || !isReady()) {
        return;
      }

      if (consentRevision !== currentConsentRevision) {
        // A user changed consent while AUS was being read. The newer local
        // decision wins over this stale response.
        queueConsentWrite(analyticsState.optedInToMarketing === true);
        reconciledGeneration = currentGeneration;
        return;
      }

      if (remoteConsent === null) {
        queueConsentWrite(consentAtStart);
      } else {
        lastSyncedConsent = remoteConsent.marketingConsentEnabled;
        if (remoteConsent.marketingConsentEnabled === consentAtStart) {
          reconciledGeneration = currentGeneration;
        } else {
          // Mark the generation reconciled before the local action emits a state
          // change, preventing that state change from starting another GET.
          reconciledGeneration = currentGeneration;
          applyingRemoteConsent = remoteConsent.marketingConsentEnabled;
          if (remoteConsent.marketingConsentEnabled) {
            await syncMessenger.call('AnalyticsController:optInToMarketing');
          } else {
            syncMessenger.call('AnalyticsController:optOutOfMarketing');
          }
          applyingRemoteConsent = undefined;
        }
      }

      reconciledGeneration = currentGeneration;
    } catch (error) {
      applyingRemoteConsent = undefined;
      console.error('Failed to synchronize marketing consent with AUS:', error);
    } finally {
      reconciliationInFlight = false;
      // A different profile may have become active while the request was in
      // flight. Reconcile that profile after releasing the in-flight guard.
      if (currentGeneration !== generation) {
        reconcile().then(() => undefined);
      }
    }
  };

  syncMessenger.subscribe(
    'AuthenticationController:stateChange',
    (newState: AuthenticationControllerState) => {
      const previousSignedIn = authenticationState.isSignedIn === true;
      const previousProfileId = getProfileId(authenticationState);
      authenticationState = newState;

      if (
        previousSignedIn !== (newState.isSignedIn === true) ||
        previousProfileId !== getProfileId(newState)
      ) {
        generation += 1;
        reconciledGeneration = -1;
        lastSyncedConsent = undefined;
        queuedConsent = undefined;
      }

      reconcile().then(() => undefined);
    },
  );

  syncMessenger.subscribe(
    'AnalyticsController:stateChange',
    (newState: AnalyticsControllerState) => {
      const hadDecision = analyticsState.marketingConsentDecisionMade === true;
      const previousConsent = analyticsState.optedInToMarketing === true;
      analyticsState = newState;
      if (previousConsent !== (newState.optedInToMarketing === true)) {
        consentRevision += 1;
        const newConsent = newState.optedInToMarketing === true;
        if (applyingRemoteConsent === newConsent) {
          applyingRemoteConsent = undefined;
        } else if (
          hadDecision &&
          newState.marketingConsentDecisionMade === true &&
          isReady()
        ) {
          queueConsentWrite(newConsent);
        }
      }
      if (!hadDecision && newState.marketingConsentDecisionMade === true) {
        reconcile().then(() => undefined);
      }
    },
  );

  reconcile().then(() => undefined);
}
