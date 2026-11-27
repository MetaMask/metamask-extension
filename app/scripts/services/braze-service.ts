import type {
  AnalyticsControllerGetStateAction,
  AnalyticsControllerStateChangeEvent,
} from '@metamask/analytics-controller';
import type {
  ClientControllerGetStateAction,
  ClientControllerStateChangeEvent,
} from '@metamask/client-controller';
import {
  selectPrimaryHdKeyringEntropySourceId,
  type KeyringControllerGetStateAction,
  type KeyringControllerStateChangeEvent,
} from '@metamask/keyring-controller';
import type { Messenger } from '@metamask/messenger';
import type {
  AuthenticationControllerGetStateAction,
  AuthenticationControllerStateChangeEvent,
} from '@metamask/profile-sync-controller/auth';
import type {
  SnapControllerClearSnapStateAction,
  SnapControllerGetSnapAction,
  SnapControllerHandleRequestAction,
  SnapControllerSnapInstalledEvent,
  SnapControllerSnapUpdatedEvent,
  SnapControllerStopSnapAction,
} from '@metamask/snaps-controllers';
import type { SnapId } from '@metamask/snaps-sdk';
import { HandlerType, SnapStatus } from '@metamask/snaps-utils';
import { ORIGIN_METAMASK } from '../../../shared/constants/app';
import {
  getBrazeIdentityAction,
  getBrazeLanguage,
  getPrimaryCanonicalProfileId,
  type BrazeIdentityAction,
} from '../../../shared/lib/braze';
import { captureException } from '../../../shared/lib/sentry';
import type {
  OnboardingControllerGetStateAction,
  OnboardingControllerStateChangeEvent,
} from '../controllers/onboarding';
import type {
  PreferencesControllerGetStateAction,
  PreferencesControllerStateChangeEvent,
} from '../controllers/preferences-controller';

const SERVICE_NAME = 'BrazeService';

export const BRAZE_SNAP_ID = 'npm:@metamask/braze-snap' as SnapId;

type AllowedActions =
  | AnalyticsControllerGetStateAction
  | AuthenticationControllerGetStateAction
  | ClientControllerGetStateAction
  | KeyringControllerGetStateAction
  | OnboardingControllerGetStateAction
  | PreferencesControllerGetStateAction
  | SnapControllerClearSnapStateAction
  | SnapControllerGetSnapAction
  | SnapControllerHandleRequestAction
  | SnapControllerStopSnapAction;

type AllowedEvents =
  | AnalyticsControllerStateChangeEvent
  | AuthenticationControllerStateChangeEvent
  | ClientControllerStateChangeEvent
  | KeyringControllerStateChangeEvent
  | OnboardingControllerStateChangeEvent
  | PreferencesControllerStateChangeEvent
  | SnapControllerSnapInstalledEvent
  | SnapControllerSnapUpdatedEvent;

export type BrazeServiceMessenger = Messenger<
  typeof SERVICE_NAME,
  AllowedActions,
  AllowedEvents
>;

type AppliedBrazeIdentity = Exclude<BrazeIdentityAction, { type: 'keep' }>;

function isSameIdentity(
  identity: AppliedBrazeIdentity,
  other: AppliedBrazeIdentity | undefined,
): boolean {
  if (identity.type === 'identify') {
    return (
      other?.type === 'identify' &&
      other.profileId === identity.profileId &&
      other.language === identity.language
    );
  }
  return other?.type === identity.type;
}

function getBrazeConfig() {
  return {
    apiKey: process.env.BRAZE_WEB_API_KEY as string,
    endpoint: process.env.BRAZE_SDK_ENDPOINT as string,
    appVersion: process.env.METAMASK_VERSION as string,
    enableLogging: Boolean(process.env.METAMASK_DEBUG),
  };
}

/**
 * Keeps the Braze SDK identified with the user's canonical profile ID.
 *
 * The background owns every gate (onboarding, Basic Functionality,
 * MetaMetrics or marketing consent, lock state, and an open UI document)
 * and reaches the Braze snap directly through `SnapController`.
 */
export class BrazeService {
  readonly name: typeof SERVICE_NAME = SERVICE_NAME;

  readonly #messenger: BrazeServiceMessenger;

  /**
   * The identity last applied in this background lifetime. Reset when kept
   * (lock or UI closed) or when a sync fails so the next eligible state retries
   * and renews any expired Braze session.
   */
  #lastAppliedIdentity: AppliedBrazeIdentity | undefined;

  #pendingSnapReset = false;

  #queue: Promise<void> = Promise.resolve();

  /**
   * Construct the Braze service.
   *
   * @param options - Options.
   * @param options.messenger - The service messenger.
   */
  constructor({ messenger }: { messenger: BrazeServiceMessenger }) {
    this.#messenger = messenger;

    const sync = () => this.#sync();
    const syncIfBrazeSnap = ({ id }: { id: string }) => {
      if (id === BRAZE_SNAP_ID) {
        this.#sync();
      }
    };

    this.#messenger.subscribe('AnalyticsController:stateChange', sync);
    this.#messenger.subscribe('AuthenticationController:stateChange', sync);
    this.#messenger.subscribe('ClientController:stateChange', sync);
    this.#messenger.subscribe('KeyringController:stateChange', sync);
    this.#messenger.subscribe('OnboardingController:stateChange', sync);
    this.#messenger.subscribe('PreferencesController:stateChange', sync);
    this.#messenger.subscribe('SnapController:snapInstalled', ({ id }) => {
      if (id === BRAZE_SNAP_ID) {
        // SnapController:clearState() re-installs preinstalled snaps with empty
        // state, so clear cached identity to ensure re-identification.
        this.#pendingSnapReset = true;
        this.#sync();
      }
    });
    this.#messenger.subscribe('SnapController:snapUpdated', syncIfBrazeSnap);

    // Re-apply after a background restart.
    this.#sync();
  }

  #evaluateIdentity(): BrazeIdentityAction {
    const { completedOnboarding } = this.#messenger.call(
      'OnboardingController:getState',
    );
    const { useExternalServices, currentLocale } = this.#messenger.call(
      'PreferencesController:getState',
    );
    const { optedIn, optedInToMarketing } = this.#messenger.call(
      'AnalyticsController:getState',
    );
    const { isSignedIn, srpSessionData } = this.#messenger.call(
      'AuthenticationController:getState',
    );
    const keyringState = this.#messenger.call('KeyringController:getState');
    const { isUiOpen } = this.#messenger.call('ClientController:getState');

    return getBrazeIdentityAction({
      completedOnboarding,
      useExternalServices,
      hasAnalyticsConsent: optedIn === true,
      hasMarketingConsent: optedInToMarketing === true,
      isUiOpen,
      isUnlocked: keyringState.isUnlocked,
      canonicalProfileId:
        keyringState.isUnlocked && isSignedIn
          ? getPrimaryCanonicalProfileId(
              selectPrimaryHdKeyringEntropySourceId(keyringState),
              srpSessionData,
            )
          : undefined,
      language: getBrazeLanguage(currentLocale),
    });
  }

  #isStillIdentifying(): boolean {
    try {
      return this.#evaluateIdentity().type === 'identify';
    } catch {
      return true;
    }
  }

  async #identify(
    profileId: string,
    language: string | undefined,
  ): Promise<boolean> {
    const result = (await this.#messenger.call('SnapController:handleRequest', {
      snapId: BRAZE_SNAP_ID,
      origin: ORIGIN_METAMASK,
      handler: HandlerType.OnClientRequest,
      request: {
        jsonrpc: '2.0',
        method: 'syncUser',
        params: {
          profileId,
          ...(language === undefined ? {} : { language }),
          config: getBrazeConfig(),
        },
      },
    })) as { flushed?: boolean } | null;

    return result?.flushed !== false;
  }

  async #clear(): Promise<boolean> {
    const snap = this.#messenger.call('SnapController:getSnap', BRAZE_SNAP_ID);
    if (!snap) {
      return true;
    }
    if (snap.status === SnapStatus.Installing) {
      return false;
    }
    await this.#messenger.call('SnapController:stopSnap', BRAZE_SNAP_ID);
    this.#messenger.call('SnapController:clearSnapState', BRAZE_SNAP_ID, false);
    return true;
  }

  #sync(): void {
    // The queue must never reject, otherwise later state changes would be
    // dropped.
    this.#queue = this.#queue.then(async () => {
      let action: BrazeIdentityAction | undefined;
      try {
        if (this.#pendingSnapReset) {
          this.#pendingSnapReset = false;
          this.#lastAppliedIdentity = undefined;
        }

        action = this.#evaluateIdentity();
        if (action.type === 'keep') {
          // Forget the previous identify so the next unlock or UI open runs
          // `syncUser` again to renew any expired 30-minute Braze session.
          this.#lastAppliedIdentity = undefined;
          return;
        }

        if (isSameIdentity(action, this.#lastAppliedIdentity)) {
          return;
        }
        this.#lastAppliedIdentity = action;

        const applied =
          action.type === 'identify'
            ? await this.#identify(action.profileId, action.language)
            : await this.#clear();

        if (!applied) {
          this.#lastAppliedIdentity = undefined;
        }
      } catch (error) {
        // A failed sync must be retried on the next state change; otherwise a
        // snap that failed to start or to reach Braze leaves Braze
        // unidentified for the rest of the background lifetime.
        this.#lastAppliedIdentity = undefined;
        // Turning off Basic Functionality stops running snaps and cancels any
        // in-flight request; only report failures while still eligible.
        if (action?.type !== 'identify' || this.#isStillIdentifying()) {
          captureException(error);
        }
      }
    });
  }
}
