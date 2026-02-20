import type { Patch } from 'immer';
import {
  deriveStateFromMetadata,
  type BaseControllerInstance,
  type StateConstraint,
  type StateMetadata,
} from '@metamask/base-controller';
import type { RootMessenger } from './messenger';

/**
 * A map of config keys to `BaseController` instances.
 * All entries must be proper `BaseController` subclasses with
 * `.name`, `.state`, and `.metadata`.
 */
export type ControllerConfig = Record<string, BaseControllerInstance>;

/**
 * Handler signature for {@link ControllerRegistry.subscribeAll}.
 */
export type StateChangeHandler = (
  controllerKey: string,
  state: StateConstraint,
  patches: Patch[],
) => void;

/**
 * Owns the two controller config maps (UI-exposed and persisted) and
 * provides state access methods and bulk subscription wiring.
 *
 * Extracted from MetamaskController to keep registry iteration
 * and messenger subscription loops in one place.
 */
export class ControllerRegistry {
  readonly #messenger: RootMessenger;

  readonly #uiConfig: ControllerConfig;

  readonly #persistConfig: ControllerConfig;

  constructor(
    messenger: RootMessenger,
    uiConfig: ControllerConfig,
    persistConfig: ControllerConfig,
  ) {
    this.#messenger = messenger;
    this.#uiConfig = uiConfig;
    this.#persistConfig = persistConfig;
  }

  // ---------------------------------------------------------------------------
  // Config access
  // ---------------------------------------------------------------------------

  get uiConfig(): ControllerConfig {
    return this.#uiConfig;
  }

  get persistConfig(): ControllerConfig {
    return this.#persistConfig;
  }

  // ---------------------------------------------------------------------------
  // State access
  // ---------------------------------------------------------------------------

  /**
   * Keyed state from a named config.
   * Returns `{ controllerKey: controllerState }` without flattening.
   * Replaces the old `memStore.getState()` pattern used by Sentry.
   */
  getKeyedState(
    configName: 'ui' | 'persist',
  ): Record<string, StateConstraint> {
    const config = this.#resolveConfig(configName);
    const result: Record<string, StateConstraint> = {};
    for (const [key, ctrl] of Object.entries(config)) {
      result[key] = ctrl.state;
    }
    return result;
  }

  /**
   * Keyed state from the persist config, filtered through
   * `deriveStateFromMetadata` so only `persist: true` properties remain.
   * Replaces the inline `getPersistedState()` helper in background.js.
   */
  getPersistedState(): Record<string, StateConstraint> {
    const result: Record<string, StateConstraint> = {};
    for (const [key, ctrl] of Object.entries(this.#persistConfig)) {
      result[key] = deriveStateFromMetadata(
        ctrl.state,
        ctrl.metadata as StateMetadata<StateConstraint>,
        'persist',
      );
    }
    return result;
  }

  // ---------------------------------------------------------------------------
  // Subscription wiring
  // ---------------------------------------------------------------------------

  /**
   * Subscribe `handler` to every named controller's `stateChange` event
   * in the specified config. Returns an array of unsubscribe functions.
   *
   * The handler receives `(controllerKey, newState, patches)` so callers
   * can identify which controller changed.
   */
  subscribeAll(
    configName: 'ui' | 'persist',
    handler: StateChangeHandler,
  ): (() => void)[] {
    const config = this.#resolveConfig(configName);
    const unsubscribers: (() => void)[] = [];

    for (const [controllerKey, controller] of Object.entries(config)) {
      const { name: controllerName } = controller;

      const wrappedHandler = (state: StateConstraint, patches: Patch[]) => {
        handler(controllerKey, state, patches);
      };

      this.#messenger.subscribe(
        `${controllerName}:stateChange` as never,
        wrappedHandler as never,
      );

      unsubscribers.push(() => {
        this.#messenger.unsubscribe(
          `${controllerName}:stateChange` as never,
          wrappedHandler as never,
        );
      });
    }

    return unsubscribers;
  }

  /**
   * Microtask-coalesced variant of {@link subscribeAll}.
   * Subscribes to every controller in the config but coalesces all
   * `stateChange` events within a synchronous cascade into a single
   * microtask callback invocation.
   *
   * Returns an array of unsubscribe functions.
   */
  scheduleOnStateChange(
    configName: 'ui' | 'persist',
    callback: () => void,
  ): (() => void)[] {
    let scheduled = false;

    return this.subscribeAll(configName, () => {
      if (!scheduled) {
        scheduled = true;
        queueMicrotask(() => {
          scheduled = false;
          callback();
        });
      }
    });
  }

  // ---------------------------------------------------------------------------
  // Internal
  // ---------------------------------------------------------------------------

  #resolveConfig(configName: 'ui' | 'persist'): ControllerConfig {
    return configName === 'ui' ? this.#uiConfig : this.#persistConfig;
  }
}
