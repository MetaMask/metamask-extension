import {
  selectPrimaryHdKeyringEntropySourceId,
  type KeyringControllerState,
} from '@metamask/keyring-controller';
import type { AuthenticationControllerState } from '@metamask/profile-sync-controller/auth';
import {
  BRAZE_TARGET,
  getBrazeConfig,
  isBrazeProfile,
} from '../../braze/protocol';

type IdentityState = {
  completedOnboarding: boolean;
  useExternalServices: boolean;
  isUiOpen: boolean;
  keyring: KeyringControllerState;
  authentication: AuthenticationControllerState;
};

/** @returns The eligible primary profile, or null to stop identification. */
export function getBrazeIdentity(state: IdentityState): string | null {
  const {
    completedOnboarding,
    useExternalServices,
    isUiOpen,
    keyring,
    authentication,
  } = state;
  if (
    !completedOnboarding ||
    !useExternalServices ||
    !authentication.isSignedIn ||
    !isUiOpen ||
    !keyring.isUnlocked
  ) {
    return null;
  }
  const primary = selectPrimaryHdKeyringEntropySourceId(keyring);
  const profile =
    primary &&
    authentication.srpSessionData?.[primary]?.profile?.canonicalProfileId;
  return isBrazeProfile(profile) ? profile : null;
}

/**
 * @param readState - Read the current eligibility and primary profile.
 * @param ready - Resolves when the offscreen document is ready.
 * @returns A state subscriber, inert outside the configured MV3 worker.
 */
export function createBrazeIdentitySync(
  readState: () => IdentityState,
  ready: Promise<void>,
): () => void {
  if (!getBrazeConfig() || !globalThis.chrome?.offscreen) {
    return () => undefined;
  }

  let active: { port: chrome.runtime.Port; profile: string } | undefined;
  const stop = () => {
    const session = active;
    active = undefined;
    session?.port.disconnect();
  };
  let offscreenReady = false;
  const sync = () => {
    if (!offscreenReady) {
      return;
    }
    try {
      const profile = getBrazeIdentity(readState());
      if (profile === active?.profile) {
        return;
      }
      stop();
      if (!profile) {
        return;
      }
      const port = chrome.runtime.connect({ name: BRAZE_TARGET });
      active = { port, profile };
      port.onDisconnect.addListener(() => {
        if (active?.port === port) {
          active = undefined;
        }
      });
      port.postMessage(profile);
    } catch {
      stop();
    }
  };
  ready.then(
    () => {
      offscreenReady = true;
      sync();
    },
    () => undefined,
  );
  return sync;
}
