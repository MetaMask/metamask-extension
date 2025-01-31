import { SnapController } from '@metamask/snaps-controllers';
import { ControllerInitFunction } from '../types';
import {
  EndowmentPermissions,
  ExcludedSnapEndowments,
  ExcludedSnapPermissions,
} from '../../../../shared/constants/snaps/permissions';
import { encryptorFactory } from '../../lib/encryptor-factory';
import PREINSTALLED_SNAPS from '../../snaps/preinstalled-snaps';
import {
  SnapControllerInitMessenger,
  SnapControllerMessenger,
} from './snap-controller-messenger';

export const SnapControllerInit: ControllerInitFunction<
  SnapController,
  SnapControllerMessenger,
  SnapControllerInitMessenger
> = (request) => {
  const {
    initMessenger,
    controllerMessenger,
    persistedState,
    metaMaskController,
  } = request;

  const allowLocalSnaps = Boolean(process.env.ALLOW_LOCAL_SNAPS);
  const requireAllowlist = Boolean(process.env.REQUIRE_SNAPS_ALLOWLIST);
  const rejectInvalidPlatformVersion = Boolean(
    process.env.REJECT_INVALID_SNAPS_PLATFORM_VERSION,
  );

  /**
   * Get the feature flags for the `SnapController.
   *
   * @returns The feature flags.
   */
  function getFeatureFlags() {
    const preferences = initMessenger.call('PreferencesController:getState');

    return {
      // @ts-expect-error: `useExternalServices` is not defined in the
      // `PreferencesState` type.
      // TODO: Verify if this is a bug in the type definitions, or if the
      // property is not meant to be accessed in this way.
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

    closeAllConnections:
      metaMaskController.removeAllConnections.bind(metaMaskController),

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

    getMnemonic:
      metaMaskController.getPrimaryKeyringMnemonic.bind(metaMaskController),

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
