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
  BrazeAction,
  OffscreenCommunicationTarget,
} from '../../../shared/constants/offscreen-communication';
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

export type BrazeSyncUserMessage = {
  target: OffscreenCommunicationTarget.brazeOffscreen;
  action: BrazeAction.syncUser;
  profileId: string | null;
};

export type BrazeSyncUserResponse =
  | { success: true }
  | { success: false; error: string };

type SendToOffscreen = (
  message: BrazeSyncUserMessage,
) => Promise<BrazeSyncUserResponse | undefined>;

const sendToOffscreenDocument: SendToOffscreen = (message) =>
  chrome.runtime.sendMessage(message);

/**
 * Keeps the Braze SDK in the offscreen document identified with the user's
 * canonical profile ID.
 *
 * The background owns every gate (onboarding, Basic Functionality, Profile
 * Sync sign-in, lock state) and sends the desired user to the offscreen
 * document whenever it changes. The offscreen document only applies it.
 */
export class BrazeService {
  readonly name: typeof SERVICE_NAME = SERVICE_NAME;

  readonly #messenger: BrazeServiceMessenger;

  readonly #offscreenReady: Promise<void>;

  readonly #sendToOffscreen: SendToOffscreen;

  /**
   * The user last sent to the offscreen document in this background lifetime.
   * A failed send is not retried until the desired user changes, so a missing
   * offscreen document does not cause a send on every state change.
   */
  #lastSentUser: string | null | undefined;

  #queue: Promise<void> = Promise.resolve();

  /**
   * Construct the Braze service.
   *
   * @param options - Options.
   * @param options.messenger - The service messenger.
   * @param options.offscreenReady - Resolves when the offscreen document can
   * receive messages.
   * @param options.sendToOffscreen - Sends a message to the offscreen
   * document. Defaults to `chrome.runtime.sendMessage`.
   */
  constructor({
    messenger,
    offscreenReady,
    sendToOffscreen = sendToOffscreenDocument,
  }: {
    messenger: BrazeServiceMessenger;
    offscreenReady: Promise<void>;
    sendToOffscreen?: SendToOffscreen;
  }) {
    this.#messenger = messenger;
    this.#offscreenReady = offscreenReady;
    this.#sendToOffscreen = sendToOffscreen;

    const sync = () => this.#sync();
    this.#messenger.subscribe('AuthenticationController:stateChange', sync);
    this.#messenger.subscribe('KeyringController:stateChange', sync);
    this.#messenger.subscribe('OnboardingController:stateChange', sync);
    this.#messenger.subscribe('PreferencesController:stateChange', sync);

    // Re-apply after a service worker restart; the offscreen document is
    // recreated with it.
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
        if (desiredUser === undefined || desiredUser === this.#lastSentUser) {
          return;
        }
        this.#lastSentUser = desiredUser;

        await this.#offscreenReady;
        const response = await this.#sendToOffscreen({
          target: OffscreenCommunicationTarget.brazeOffscreen,
          action: BrazeAction.syncUser,
          profileId: desiredUser,
        });
        if (!response?.success) {
          throw new Error(
            `Braze user sync failed: ${response?.error ?? 'no response from the offscreen document'}`,
          );
        }
      } catch (error) {
        captureException(error);
      }
    });
  }
}
