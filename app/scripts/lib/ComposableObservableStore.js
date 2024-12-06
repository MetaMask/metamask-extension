import { ObservableStore } from '@metamask/obs-store';
import { getPersistentState } from '@metamask/base-controller';

/**
 * @typedef {import('@metamask/base-controller').ControllerMessenger} ControllerMessenger
 */

/**
 * An ObservableStore that can composes a flat
 * structure of child stores based on configuration
 */
export default class ComposableObservableStore extends ObservableStore {
  /**
   * Describes which stores are being composed. The key is the name of the
   * store, and the value is either an ObserableStore, or a controller that
   * extends one of the two base controllers in the `@metamask/base-controller`
   * package.
   *
   * @type {Record<string, object>}
   */
  config = {};

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
  constructor({ config, controllerMessenger, state, persist }) {
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
  updateStructure(config) {
    this.config = config;
    this.removeAllListeners();
    const initialState = {};
    for (const key of Object.keys(config)) {
      if (!config[key]) {
        throw new Error(`Undefined '${key}'`);
      }
      const store = config[key];
      if (store.subscribe) {
        config[key].subscribe((state) => {
          this.#onStateChange(key, state);
        });
      } else {
        this.controllerMessenger.subscribe(
          `${store.name}:stateChange`,
          (state) => {
            let updatedState = state;
            if (this.persist) {
              updatedState = getPersistentState(state, config[key].metadata);
            }
            this.#onStateChange(key, updatedState);
          },
        );
      }

      const initialStoreState = store.state ?? store.getState?.();

      initialState[key] =
        this.persist && config[key].metadata
          ? getPersistentState(initialStoreState, config[key].metadata)
          : initialStoreState;
    }
    this.updateState(initialState);
  }

  #onStateChange(controllerKey, newState) {
    const oldState = this.getState()[controllerKey];

    this.updateState({ [controllerKey]: newState });

    this.emit('stateChange', { oldState, newState, controllerKey });
  }
}
