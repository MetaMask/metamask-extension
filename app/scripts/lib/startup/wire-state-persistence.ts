import { deriveStateFromMetadata } from '@metamask/base-controller';
import log from 'loglevel';
import { captureException } from '../../../../shared/lib/sentry';
import type { MetaMaskStateType } from '../../../../shared/lib/stores/base-store';
import {
  backedUpStateKeys,
  type BackedUpStateKey,
  type PersistenceManager,
} from '../../../../shared/lib/stores/persistence-manager';

type SafePersist = ReturnType<
  typeof import('../safe-reload').getRequestSafeReload
>['safePersist'];
type ControllerState = Parameters<typeof deriveStateFromMetadata>[0];
type ControllerStateMetadata = Parameters<typeof deriveStateFromMetadata>[1];

type StoreConfigEntry = {
  metadata?: ControllerStateMetadata;
};

export type WireStatePersistenceController = {
  store: {
    getState: () => MetaMaskStateType;
    config: Record<string, StoreConfigEntry | undefined>;
    on: (event: string, listener: (...args: unknown[]) => unknown) => void;
  };
  controllerMessenger: {
    call: (action: `${string}:getState`) => unknown;
  };
};

export type WireStatePersistenceSentry = Pick<
  NonNullable<typeof globalThis.sentry>,
  'captureException'
>;

export type WireStatePersistenceDeps = {
  controller: WireStatePersistenceController;
  persistenceManager: Pick<PersistenceManager, 'storageKind' | 'update'>;
  initState: MetaMaskStateType;
  safePersist: SafePersist;
  sentry?: WireStatePersistenceSentry | null;
};

type ControllerStateChangePayload = {
  controllerKey: string;
  newState: unknown;
  oldState: unknown;
  patches: unknown;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object';
}

function isBackedUpStateKey(key: string): key is BackedUpStateKey {
  return (backedUpStateKeys as readonly string[]).includes(key);
}

export function wireStatePersistence({
  controller,
  persistenceManager,
  initState,
  safePersist,
  sentry,
}: WireStatePersistenceDeps): void {
  /**
   * @type {Array<string>} List of controller store keys that have changed since initialization.
   */
  const changedControllerKeys: string[] = [];
  const currentState = controller.store.getState();
  for (const key of Object.keys(currentState)) {
    const initialControllerState = initState[key] || {};
    const newControllerState = currentState[key];
    if (!isRecord(newControllerState)) {
      captureException(
        new Error(
          `Invalid controller state for '${key}' of type '${newControllerState === null ? 'null' : typeof newControllerState}'`,
        ),
      );
      continue;
    }
    const newControllerStateKeys = Object.keys(newControllerState);

    // if the number of keys has changed, we need to persist the new state
    if (
      newControllerStateKeys.length ===
      Object.keys(initialControllerState as object).length
    ) {
      // if any of the controller's own top-level keys have changed
      // (via reference comparison) we need to persist the new state.
      const typedInitialState = initialControllerState as Record<
        string,
        unknown
      >;
      for (const subKey of newControllerStateKeys) {
        if (newControllerState[subKey] !== typedInitialState[subKey]) {
          changedControllerKeys.push(key);
          break;
        }
      }
    } else {
      changedControllerKeys.push(key);
    }
  }

  if (persistenceManager.storageKind === 'split') {
    if (changedControllerKeys.length > 0) {
      log.info(
        `MetaMaskController state changed during configuration for controllers: ${changedControllerKeys.join(', ')}. Persisting updated state.`,
      );
      // update the new state
      changedControllerKeys.forEach((key) => {
        persistenceManager.update(key, currentState[key]);
      });
      // then persist it
      safePersist().catch((error) => {
        log.error('Error persisting updated state:', error);
        sentry?.captureException(error);
      });
    }

    controller.store.on('stateChange', async (payload: unknown) => {
      const { controllerKey, newState } =
        payload as ControllerStateChangePayload;
      persistenceManager.update(controllerKey, newState);

      // if this key is one of the `backedUpStateKeys` we must always
      // re-persist all of the other `backedUpStateKeys`, as they must always
      // stored in the backup DB together.
      if (isBackedUpStateKey(controllerKey)) {
        backedUpStateKeys.forEach((key) => {
          if (key === controllerKey) {
            // already updated this one
            return;
          }
          // Get the state for this backed-up key using messenger.
          // We filter to only persistent properties using deriveStateFromMetadata
          // to match what ComposableObservableStore does in stateChange events.
          // This ensures non-persistent properties (e.g., KeyringController's
          // isUnlocked, keyrings, encryptionKey) are not written to storage.
          const controllerConfig = controller.store.config[key];
          if (!controllerConfig?.metadata) {
            throw new Error(
              `Cannot backup ${key}: controller metadata is required but not found. ` +
                `All controllers in backedUpStateKeys must extend BaseController and define metadata.`,
            );
          }
          const fullState = controller.controllerMessenger.call(
            `${key}:getState`,
          );
          const state = deriveStateFromMetadata(
            fullState as ControllerState,
            controllerConfig.metadata,
            'persist',
          );
          persistenceManager.update(key, state);
        });
      }
      try {
        await safePersist();
      } catch (error) {
        log.error('Error persisting state change:', error);
        sentry?.captureException(error);
      }
    });
  } else {
    if (changedControllerKeys.length > 0) {
      log.info(
        `MetaMaskController state changed during configuration for controllers: ${changedControllerKeys.join(', ')}. Persisting updated state.`,
      );
      // persist the new state
      safePersist(currentState).catch((error) => {
        log.error('Error persisting updated controller state:', error);
        sentry?.captureException(error);
      });
    }
    controller.store.on('update', (...args: unknown[]) =>
      safePersist(...(args as Parameters<SafePersist>)),
    );
  }
  controller.store.on('error', (error) => {
    log.error('MetaMask controller.store error:', error);
    sentry?.captureException(error);
  });
}
