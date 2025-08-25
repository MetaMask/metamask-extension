import { SnapController } from '@metamask/snaps-controllers';
import { hasProperty, Json } from '@metamask/utils';
import { ControllerInitFunction } from '../types';
import {
  EndowmentPermissions,
  ExcludedSnapEndowments,
  ExcludedSnapPermissions,
} from '../../../../shared/constants/snaps/permissions';
import { encryptorFactory } from '../../lib/encryptor-factory';
import { KeyringType } from '../../../../shared/constants/keyring';
import {
  SnapControllerInitMessenger,
  SnapControllerMessenger,
} from '../messengers/snaps';
import { getBooleanFlag } from '../../lib/util';

// Copied from `@metamask/snaps-controllers`, since it is not exported.
type TrackingEventPayload = {
  event: string;
  category: string;
  properties: Record<string, Json | undefined>;
};

type TrackEventHook = (event: TrackingEventPayload) => void;

/**
 * Initialize the Snap controller.
 *
 * @param request - The request object.
 * @param request.initMessenger - The init messenger. This has access to
 * different functions than the controller messenger, and should be used for
 * initialization purposes only.
 * @param request.controllerMessenger - The messenger to use for the controller.
 * @param request.persistedState - The persisted state of the extension.
 * @param request.removeAllConnections - Function to remove all connections for
 * a given origin.
 * @param request.preinstalledSnaps - The list of preinstalled Snaps.
 * @param request.trackEvent - Event tracking hook.
 * @returns The initialized controller.
 */
export const SnapControllerInit: ControllerInitFunction<
  SnapController,
  SnapControllerMessenger,
  SnapControllerInitMessenger
> = ({
  initMessenger,
  controllerMessenger,
  persistedState,
  removeAllConnections,
  preinstalledSnaps,
  trackEvent,
}) => {
  const allowLocalSnaps = getBooleanFlag(process.env.ALLOW_LOCAL_SNAPS);
  const requireAllowlist = getBooleanFlag(process.env.REQUIRE_SNAPS_ALLOWLIST);
  const rejectInvalidPlatformVersion = getBooleanFlag(
    process.env.REJECT_INVALID_SNAPS_PLATFORM_VERSION,
  );

  ///: BEGIN:ONLY_INCLUDE_IF(build-flask)
  const forcePreinstalledSnaps = getBooleanFlag(
    process.env.FORCE_PREINSTALLED_SNAPS,
  );
  ///: END:ONLY_INCLUDE_IF

  async function getMnemonicSeed() {
    const keyrings = initMessenger.call(
      'KeyringController:getKeyringsByType',
      KeyringType.hdKeyTree,
    );

    if (
      !keyrings[0] ||
      !hasProperty(keyrings[0], 'seed') ||
      !(keyrings[0].seed instanceof Uint8Array)
    ) {
      throw new Error('Primary keyring mnemonic unavailable.');
    }

    return keyrings[0].seed;
  }

  /**
   * Get the feature flags for the `SnapController.
   *
   * @returns The feature flags.
   */
  function getFeatureFlags() {
    const preferences = initMessenger.call('PreferencesController:getState');

    return {
      disableSnaps: preferences.useExternalServices === false,
    };
  }

  const controller = new SnapController({
    dynamicPermissions: ['endowment:caip25'],
    environmentEndowmentPermissions: Object.values(EndowmentPermissions),
    excludedPermissions: {
      ...ExcludedSnapPermissions,
      ...ExcludedSnapEndowments,
    },

    closeAllConnections: removeAllConnections,

    // @ts-expect-error: `persistedState.SnapController` is not compatible with
    // the expected type.
    // TODO: Look into the type mismatch.
    state: persistedState.SnapController,

    // @ts-expect-error: `controllerMessenger` is not compatible with the
    // expected type.
    // TODO: Look into the type mismatch.
    messenger: controllerMessenger,
    featureFlags: {
      allowLocalSnaps,
      requireAllowlist,
      rejectInvalidPlatformVersion,
      ///: BEGIN:ONLY_INCLUDE_IF(build-flask)
      forcePreinstalledSnaps,
      ///: END:ONLY_INCLUDE_IF
      useCaip25Permission: true,
    },

    // @ts-expect-error: `encryptorFactory` is not compatible with the expected
    // type.
    // TODO: Look into the type mismatch.
    encryptor: encryptorFactory(600_000),

    getMnemonicSeed,

    preinstalledSnaps,
    getFeatureFlags,

    // `TrackEventHook` from `snaps-controllers` uses `Json | undefined` for
    // properties, but `MetaMetricsEventPayload` uses `Json`, even though
    // `undefined` is supported.
    trackEvent: trackEvent as TrackEventHook,
  });

  return {
    controller,
  };
};
