import { SnapController } from '@metamask/snaps-controllers';
import { hasProperty } from '@metamask/utils';

import { KeyringType } from '../../../../shared/constants/keyring';
import {
  EndowmentPermissions,
  ExcludedSnapEndowments,
  ExcludedSnapPermissions,
} from '../../../../shared/constants/snaps/permissions';
import { encryptorFactory } from '../../lib/encryptor-factory';
import { getBooleanFlag } from '../../lib/util';
// TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
import PREINSTALLED_SNAPS from '../../snaps/preinstalled-snaps';
import type {
  SnapControllerInitMessenger,
  SnapControllerMessenger,
} from '../messengers/snaps';
import type { ControllerInitFunction } from '../types';

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
  // TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31888
  // eslint-disable-next-line no-restricted-globals
  const allowLocalSnaps = getBooleanFlag(process.env.ALLOW_LOCAL_SNAPS);
  // TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31888
  // eslint-disable-next-line no-restricted-globals
  const requireAllowlist = getBooleanFlag(process.env.REQUIRE_SNAPS_ALLOWLIST);
  const rejectInvalidPlatformVersion = getBooleanFlag(
    // TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31888
    // eslint-disable-next-line no-restricted-globals
    process.env.REJECT_INVALID_SNAPS_PLATFORM_VERSION,
  );

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
      disableSnaps: !preferences.useExternalServices,
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

    getMnemonicSeed,

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
