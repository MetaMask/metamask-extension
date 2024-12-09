import { ObservableStore } from '@metamask/obs-store';
import {
  ActionConstraint,
  ControllerMessenger,
  EventConstraint,
  getPersistentState,
} from '@metamask/base-controller';
import { MemStoreControllersComposedState } from '../../../shared/types/metamask';
import { getKnownPropertyNames } from '@metamask/utils';

/**
 * @typedef {import('@metamask/base-controller').ControllerMessenger} ControllerMessenger
 */

/**
 * An ObservableStore that can composes a flat
 * structure of child stores based on configuration
 */
export default class ComposableObservableStore extends ObservableStore<MemStoreControllersComposedState> {
  /**
   * Describes which stores are being composed. The key is the name of the
   * store, and the value is either an ObserableStore, or a controller that
   * extends one of the two base controllers in the `@metamask/base-controller`
   * package.
   *
   * @type {Record<string, object>}
   */
  config: Partial<MemStoreControllersComposedState> = {};
  controllerMessenger: ControllerMessenger<ActionConstraint, EventConstraint>;
  persist: boolean;

  /**
   * Create a new store
   *
   * @param {object} options
   * @param {object} [options.config] - Map of internal state keys to child stores
   * @param {ControllerMessenger} options.controllerMessenger - The controller
   *   messenger, used for subscribing to events from BaseControllerV2-based
   *   controllers.
   * @param {object} [options.state] - The initial store state
   * @param {boolean} [options.persist] - Whether or not to apply the persistence for v2 controllers
   */
  constructor({
    config,
    controllerMessenger,
    state,
    persist,
  }: {
    config: MemStoreControllersComposedState;
    controllerMessenger: ControllerMessenger<ActionConstraint, EventConstraint>;
    state: MemStoreControllersComposedState;
    persist: boolean;
  }) {
    super(state);
    this.persist = persist;
    this.controllerMessenger = controllerMessenger;
    if (config) {
      this.updateStructure(config);
    }
  }

  /**
   * Composes a new internal store subscription structure
   *
   * @param {Record<string, object>} config - Describes which stores are being
   *   composed. The key is the name of the store, and the value is either an
   *   ObserableStore, or a controller that extends one of the two base
   *   controllers in the `@metamask/base-controller` package.
   */
  updateStructure(config: MemStoreControllersComposedState) {
    this.config = config;
    this.removeAllListeners();
    const initialState = {};
    for (const controllerKey of getKnownPropertyNames(config)) {
      if (!config[controllerKey]) {
        throw new Error(`Undefined '${controllerKey}'`);
      }
      const store = config[controllerKey];
      if (store.subscribe) {
        config[controllerKey].subscribe(
          (
            state: MemStoreControllersComposedState[keyof MemStoreControllersComposedState],
          ) => {
            this.#onStateChange(controllerKey, state);
          },
        );
      } else {
        this.controllerMessenger.subscribe<`${typeof controllerKey}:stateChange`>(
          `${controllerKey}:stateChange`,
          // @ts-expect-error TODO: Fix `handler` being typed as `never` by defining `Global{Actions,Events}` types and supplying them to `MetamaskController['controllerMessenger']`
          (
            state: MemStoreControllersComposedState[keyof MemStoreControllersComposedState],
          ) => {
            let updatedState = state;
            if (this.persist) {
              updatedState = getPersistentState(
                state,
                config[controllerKey].metadata,
              );
            }
            this.#onStateChange(controllerKey, updatedState);
          },
        );
      }

      const initialState = 'subscribe' in store ? store.getState?.() : store;

      initialState[controllerKey] =
        this.persist && config[controllerKey].metadata
          ? getPersistentState(initialState, config[controllerKey].metadata)
          : initialState;
    }
    this.updateState(initialState);
  }

  #onStateChange(
    controllerKey: keyof MemStoreControllersComposedState,
    newState: MemStoreControllersComposedState[keyof MemStoreControllersComposedState],
  ) {
    const oldState = this.getState()[controllerKey];

    this.updateState({ [controllerKey]: newState });

    this.emit('stateChange', { oldState, newState, controllerKey });
  }
}
