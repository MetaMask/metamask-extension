import { SnapController } from '@metamask/snaps-controllers';
import { hasProperty } from '@metamask/utils';
import { ControllerInitFunction } from '../types';
import {
  EndowmentPermissions,
  ExcludedSnapEndowments,
  ExcludedSnapPermissions,
} from '../../../../shared/constants/snaps/permissions';
import { encryptorFactory } from '../../lib/encryptor-factory';
import PREINSTALLED_SNAPS from '../../snaps/preinstalled-snaps';
import { KeyringType } from '../../../../shared/constants/keyring';
import {
  SnapControllerInitMessenger,
  SnapControllerMessenger,
} from '../messengers/snaps';
import { getBooleanFlag } from '../../lib/util';

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
}) => {
  const allowLocalSnaps = getBooleanFlag(process.env.ALLOW_LOCAL_SNAPS);
  const requireAllowlist = getBooleanFlag(process.env.REQUIRE_SNAPS_ALLOWLIST);
  const rejectInvalidPlatformVersion = getBooleanFlag(
    process.env.REJECT_INVALID_SNAPS_PLATFORM_VERSION,
  );

  function getMnemonic() {
    const keyrings = initMessenger.call(
      'KeyringController:getKeyringsByType',
      KeyringType.hdKeyTree,
    );

    if (
      !keyrings[0] ||
      !hasProperty(keyrings[0], 'mnemonic') ||
      !(keyrings[0].mnemonic instanceof Uint8Array)
    ) {
      throw new Error('Primary keyring mnemonic unavailable.');
    }

    // `SnapController` expects a promise.
    return Promise.resolve(keyrings[0].mnemonic);
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
    },

    // @ts-expect-error: `encryptorFactory` is not compatible with the expected
    // type.
    // TODO: Look into the type mismatch.
    encryptor: encryptorFactory(600_000),

    getMnemonic,

    // @ts-expect-error: `PREINSTALLED_SNAPS` is readonly, but the controller
    // expects a mutable array.
    // TODO: Update the controller to accept a readonly array.
    preinstalledSnaps: PREINSTALLED_SNAPS,
    getFeatureFlags,
  });

  return {
    controller,
  };
};
