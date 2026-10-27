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
import {
  getDesiredBrazeUser,
  getPrimaryCanonicalProfileId,
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

type AllowedActions =
  | AuthenticationControllerGetStateAction
  | KeyringControllerGetStateAction
  | OnboardingControllerGetStateAction
  | PreferencesControllerGetStateAction;

type AllowedEvents =
  | AuthenticationControllerStateChangeEvent
  | KeyringControllerStateChangeEvent
  | OnboardingControllerStateChangeEvent
  | PreferencesControllerStateChangeEvent;

export type BrazeServiceMessenger = Messenger<
  typeof SERVICE_NAME,
  AllowedActions,
  AllowedEvents
>;

export type SyncBrazeUser = (profileId: string | null) => Promise<void>;

/**
 * Keeps the Braze SDK identified with the user's canonical profile ID.
 *
 * The background owns every gate (onboarding, Basic Functionality, Profile
 * Sync sign-in, lock state) and applies the desired user whenever it changes
 * through a platform-specific `syncUser`: the offscreen document on MV3, and
 * the background page itself on MV2.
 */
export class BrazeService {
  readonly name: typeof SERVICE_NAME = SERVICE_NAME;

  readonly #messenger: BrazeServiceMessenger;

  readonly #syncUser: SyncBrazeUser;

  /**
   * The user last applied in this background lifetime. A failed sync is not
   * retried until the desired user changes, so a missing host or offscreen
   * document does not cause a sync on every state change.
   */
  #lastSyncedUser: string | null | undefined;

  #queue: Promise<void> = Promise.resolve();

  /**
   * Construct the Braze service.
   *
   * @param options - Options.
   * @param options.messenger - The service messenger.
   * @param options.syncUser - Applies the desired user. The offscreen document
   * target on MV3, or the background Braze host on MV2.
   */
  constructor({
    messenger,
    syncUser,
  }: {
    messenger: BrazeServiceMessenger;
    syncUser: SyncBrazeUser;
  }) {
    this.#messenger = messenger;
    this.#syncUser = syncUser;

    const sync = () => this.#sync();
    this.#messenger.subscribe('AuthenticationController:stateChange', sync);
    this.#messenger.subscribe('KeyringController:stateChange', sync);
    this.#messenger.subscribe('OnboardingController:stateChange', sync);
    this.#messenger.subscribe('PreferencesController:stateChange', sync);

    // Re-apply after a background restart; the host is recreated with it.
    this.#sync();
  }

  #getDesiredUser(): string | null | undefined {
    const { completedOnboarding } = this.#messenger.call(
      'OnboardingController:getState',
    );
    const { useExternalServices } = this.#messenger.call(
      'PreferencesController:getState',
    );
    const { isSignedIn, srpSessionData } = this.#messenger.call(
      'AuthenticationController:getState',
    );
    const keyringState = this.#messenger.call('KeyringController:getState');

    return getDesiredBrazeUser({
      completedOnboarding,
      useExternalServices,
      isSignedIn,
      isUnlocked: keyringState.isUnlocked,
      canonicalProfileId: getPrimaryCanonicalProfileId(
        keyringState.isUnlocked
          ? selectPrimaryHdKeyringEntropySourceId(keyringState)
          : undefined,
        srpSessionData,
      ),
    });
  }

  #sync(): void {
    // The queue must never reject, otherwise later state changes would be
    // dropped.
    this.#queue = this.#queue.then(async () => {
      try {
        const desiredUser = this.#getDesiredUser();
        if (desiredUser === undefined || desiredUser === this.#lastSyncedUser) {
          return;
        }
        this.#lastSyncedUser = desiredUser;

        await this.#syncUser(desiredUser);
      } catch (error) {
        captureException(error);
      }
    });
  }
}
