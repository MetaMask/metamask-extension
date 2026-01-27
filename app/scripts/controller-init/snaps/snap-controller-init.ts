import { SnapController } from '@metamask/snaps-controllers';
import { HandlerType } from '@metamask/snaps-utils';
import { SnapEndowments } from '@metamask/snaps-rpc-methods';
import { createDeferredPromise, hasProperty, Json } from '@metamask/utils';
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
import { OnboardingControllerState } from '../../controllers/onboarding';

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
}) => {
  const allowLocalSnaps = getBooleanFlag(process.env.ALLOW_LOCAL_SNAPS);
  const requireAllowlist = getBooleanFlag(process.env.REQUIRE_SNAPS_ALLOWLIST);
  const rejectInvalidPlatformVersion = getBooleanFlag(
    process.env.REJECT_INVALID_SNAPS_PLATFORM_VERSION,
  );
  const autoUpdatePreinstalledSnaps = getBooleanFlag(
    process.env.AUTO_UPDATE_PREINSTALLED_SNAPS,
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

  /**
   * Async function that resolves when onboarding has been completed.
   *
   * @returns A promise that resolves when onboarding is complete.
   */
  async function ensureOnboardingComplete() {
    const { completedOnboarding } = initMessenger.call(
      'OnboardingController:getState',
    );

    if (completedOnboarding) {
      return;
    }

    const { promise, resolve } = createDeferredPromise();

    const listener = (state: OnboardingControllerState) => {
      if (state.completedOnboarding) {
        resolve();
        initMessenger.unsubscribe('OnboardingController:stateChange', listener);
      }
    };

    initMessenger.subscribe('OnboardingController:stateChange', listener);

    await promise;
  }

  const controller = new SnapController({
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
      autoUpdatePreinstalledSnaps,
      ///: BEGIN:ONLY_INCLUDE_IF(build-flask)
      forcePreinstalledSnaps,
      ///: END:ONLY_INCLUDE_IF
    },

    // @ts-expect-error: `encryptorFactory` is not compatible with the expected
    // type.
    // TODO: Look into the type mismatch.
    encryptor: encryptorFactory(600_000),

    getMnemonicSeed,

    preinstalledSnaps,
    getFeatureFlags,

    ensureOnboardingComplete,

    // `TrackEventHook` from `snaps-controllers` uses `Json | undefined` for
    // properties, but `MetaMetricsEventPayload` uses `Json`, even though
    // `undefined` is supported.
    trackEvent: initMessenger.call.bind(
      initMessenger,
      'MetaMetricsController:trackEvent',
    ) as unknown as TrackEventHook,
  });

  // Patch setClientActive to parallelize lifecycle hooks and avoid N+1 API calls
  // This addresses the N+1 API call issue where lifecycle hooks were being
  // called sequentially, causing performance issues during app initialization.
  // eslint-disable-next-line func-names
  controller.setClientActive = function (active: boolean): void {
    const handlerType = active ? HandlerType.OnActive : HandlerType.OnInactive;
    const snaps = controller.getRunnableSnaps();

    // Create an array of promises for lifecycle hooks to execute in parallel
    const lifecyclePromises = snaps
      .map((snap) => {
        try {
          // Check if snap has lifecycle hooks endowment
          const hasLifecycleHooksEndowment = controllerMessenger.call(
            'PermissionController:hasPermission',
            snap.id,
            SnapEndowments.LifecycleHooks,
          );

          if (!hasLifecycleHooksEndowment) {
            return null;
          }

          // Call the lifecycle hook for this snap
          return controller
            .handleRequest({
              snapId: snap.id,
              origin: 'metamask',
              handler: handlerType,
              request: {
                jsonrpc: '2.0' as const,
                method: '',
                params: [],
              },
            })
            .catch((error: Error) => {
              console.error(
                `Error calling lifecycle hook "${handlerType}" for Snap "${snap.id}":`,
                error.message,
              );
              return null;
            });
        } catch (error) {
          console.error(
            `Error preparing lifecycle hook for Snap "${snap.id}":`,
            error instanceof Error ? error.message : String(error),
          );
          return null;
        }
      })
      .filter((promise): promise is Promise<unknown> => promise !== null);

    // Execute all lifecycle hooks in parallel using Promise.allSettled
    // This ensures all hooks are called even if some fail
    if (lifecyclePromises.length > 0) {
      Promise.allSettled(lifecyclePromises).catch((error: Error) => {
        console.error('Error executing parallel lifecycle hooks:', error);
      });
    }
  };

  initMessenger.subscribe('KeyringController:lock', () => {
    initMessenger.call('SnapController:setClientActive', false);
  });

  initMessenger.subscribe('KeyringController:unlock', () => {
    initMessenger.call('SnapController:setClientActive', true);
  });

  return {
    controller,
  };
};
