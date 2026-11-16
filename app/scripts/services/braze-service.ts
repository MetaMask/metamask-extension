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
import {
  BRAZE_BANNER_PLACEMENT_IDS,
  getDesiredBrazeUser,
  getPrimaryCanonicalProfileId,
  type BrazeBanner,
  type BrazeBannerInteraction,
  type BrazeHost,
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
import type { BrazeServiceMethodActions } from './braze-service-method-action-types';

const SERVICE_NAME = 'BrazeService';

const MESSENGER_EXPOSED_METHODS = [
  'getBanner',
  'logBannerImpression',
  'logBannerClick',
  'dismissBanner',
] as const;

export type BrazeServiceActions = BrazeServiceMethodActions;

type AllowedActions =
  | AuthenticationControllerGetStateAction
  | ClientControllerGetStateAction
  | KeyringControllerGetStateAction
  | OnboardingControllerGetStateAction
  | PreferencesControllerGetStateAction;

type AllowedEvents =
  | AuthenticationControllerStateChangeEvent
  | ClientControllerStateChangeEvent
  | KeyringControllerStateChangeEvent
  | OnboardingControllerStateChangeEvent
  | PreferencesControllerStateChangeEvent;

export type BrazeServiceMessenger = Messenger<
  typeof SERVICE_NAME,
  BrazeServiceActions | AllowedActions,
  AllowedEvents
>;

/**
 * Keeps the Braze SDK identified with the user's canonical profile ID, and
 * serves that user's banners to the UI.
 *
 * The background owns every gate (onboarding, Basic Functionality, Profile
 * Sync sign-in, lock state, an open UI document) and applies the desired user
 * whenever it changes through a platform-specific host: the offscreen document
 * on MV3, and the background page itself on MV2.
 *
 * Banner calls only reach the host while it is identified as the desired user,
 * so the UI never sees another user's banners, and nothing is logged for a
 * user Braze must not track.
 */
export class BrazeService {
  readonly name: typeof SERVICE_NAME = SERVICE_NAME;

  readonly #messenger: BrazeServiceMessenger;

  readonly #host: BrazeHost;

  /**
   * The user last applied in this background lifetime. A failed sync is
   * retried on the next state change.
   */
  #lastSyncedUser: string | null | undefined;

  #queue: Promise<void> = Promise.resolve();

  /**
   * Construct the Braze service.
   *
   * @param options - Options.
   * @param options.messenger - The service messenger.
   * @param options.host - The offscreen client on MV3, or the in-process host
   * on MV2.
   */
  constructor({
    messenger,
    host,
  }: {
    messenger: BrazeServiceMessenger;
    host: BrazeHost;
  }) {
    this.#messenger = messenger;
    this.#host = host;

    this.#messenger.registerMethodActionHandlers(
      this,
      MESSENGER_EXPOSED_METHODS,
    );

    const sync = () => this.#sync();
    this.#messenger.subscribe('AuthenticationController:stateChange', sync);
    this.#messenger.subscribe('KeyringController:stateChange', sync);
    this.#messenger.subscribe('OnboardingController:stateChange', sync);
    this.#messenger.subscribe('PreferencesController:stateChange', sync);
    this.#messenger.subscribe('ClientController:stateChange', () => {
      // Re-apply the user whenever a UI document opens or closes. Applying the
      // same user is a no-op in the SDK, but the flush that follows lets it
      // start a new session when the previous one expired while no document
      // was open.
      this.#lastSyncedUser = undefined;
      this.#sync();
    });

    // Re-apply after a background restart; the host is recreated with it.
    this.#sync();
  }

  /**
   * Get the banner for a placement.
   *
   * @param placementId - The placement ID.
   * @returns The banner, or `null` when there is none or the user is not
   * identified with Braze.
   */
  async getBanner(placementId: string): Promise<BrazeBanner | null> {
    try {
      if (!(await this.#canUseBanners(placementId))) {
        return null;
      }
      return await this.#host.getBanner(placementId);
    } catch (error) {
      captureException(error);
      return null;
    }
  }

  /**
   * Log that a banner was shown. Call it for control banners too, even though
   * they render nothing.
   *
   * @param placementId - The placement ID.
   * @param bannerId - The banner ID.
   */
  async logBannerImpression(
    placementId: string,
    bannerId: string,
  ): Promise<void> {
    await this.#logBannerInteraction(placementId, bannerId, 'impression');
  }

  /**
   * Log that a banner was clicked.
   *
   * @param placementId - The placement ID.
   * @param bannerId - The banner ID.
   */
  async logBannerClick(placementId: string, bannerId: string): Promise<void> {
    await this.#logBannerInteraction(placementId, bannerId, 'click');
  }

  /**
   * Dismiss a banner. Braze stops serving it to this user.
   *
   * @param placementId - The placement ID.
   * @param bannerId - The banner ID.
   */
  async dismissBanner(placementId: string, bannerId: string): Promise<void> {
    await this.#logBannerInteraction(placementId, bannerId, 'dismiss');
  }

  async #logBannerInteraction(
    placementId: string,
    bannerId: string,
    interaction: BrazeBannerInteraction,
  ): Promise<void> {
    try {
      if (!(await this.#canUseBanners(placementId))) {
        return;
      }
      await this.#host.logBannerInteraction(placementId, bannerId, interaction);
    } catch (error) {
      captureException(error);
    }
  }

  /**
   * Whether the host is identified as the desired user, once pending syncs
   * have settled.
   *
   * @param placementId - The requested placement.
   * @returns True when banner calls may reach the host.
   */
  async #canUseBanners(placementId: string): Promise<boolean> {
    if (!BRAZE_BANNER_PLACEMENT_IDS.includes(placementId)) {
      return false;
    }

    // A sync can be queued while waiting, for example when another UI
    // document opens.
    let queue: Promise<void>;
    do {
      queue = this.#queue;
      await queue;
    } while (queue !== this.#queue);

    const desiredUser = this.#getDesiredUser();
    return (
      typeof desiredUser === 'string' && desiredUser === this.#lastSyncedUser
    );
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
    const { isUiOpen } = this.#messenger.call('ClientController:getState');

    return getDesiredBrazeUser({
      completedOnboarding,
      useExternalServices,
      isSignedIn,
      isUiOpen,
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

        await this.#host.syncUser(desiredUser);
      } catch (error) {
        // A failed sync must be retried on the next state change; otherwise a
        // missing offscreen document or a failed SDK load leaves Braze
        // unidentified for the rest of the background lifetime.
        this.#lastSyncedUser = undefined;
        captureException(error);
      }
    });
  }
}
