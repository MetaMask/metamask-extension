import { ObservableStore } from '@metamask/obs-store';
import { getPersistentState } from '@metamask/base-controller';

/**
 * @typedef {import('@metamask/base-controller').Messenger} Messenger
 * @typedef {import('@metamask/base-controller').StateMetadataConstraint} StateMetadataConstraint
 * @typedef {import('immer').Patch} Patch
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
   * @param {Messenger} options.controllerMessenger - The controller
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
      } else if (this.persist) {
        this.controllerMessenger.subscribe(
          `${store.name}:stateChange`,
          (state, patches) => {
            if (this.#changedPersistedProperty(config[key].metadata, patches)) {
              this.#onStateChange(
                key,
                getPersistentState(state, config[key].metadata),
              );
            }
          },
        );
      } else {
        this.controllerMessenger.subscribe(
          `${store.name}:stateChange`,
          (state) => this.#onStateChange(key, state),
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

  /**
   * Merges all child store state into a single object rather than
   * returning an object keyed by child store class name
   *
   * @returns {object} Object containing merged child store state
   */
  getFlatState() {
    if (!this.config) {
      return {};
    }
    let flatState = {};
    for (const key of Object.keys(this.config)) {
      const controller = this.config[key];
      const state = controller.getState
        ? controller.getState()
        : controller.state;
      flatState = { ...flatState, ...state };
    }
    return flatState;
  }

  #onStateChange(controllerKey, newState) {
    const oldState = this.getState()[controllerKey];

    this.updateState({ [controllerKey]: newState });

    this.emit('stateChange', { oldState, newState, controllerKey });
  }

  /**
   * Returns true if the given set of patches makes changes to a persisted property.
   *
   * Note that we assume at least one property is persisted, so a complete replacement patch
   * always returns true.
   *
   * @param {StateMetadataConstraint} metadata - Controller metadata.
   * @param {Patch[]} patches - A list of patches, corresponding to a single state update.
   * @returns True if the patches contain a change to persisted state, false otherwise.
   */
  #changedPersistedProperty(metadata, patches) {
    return patches.some((patch) => {
      // Complete state replacement
      if (patch.path.length === 0) {
        return true;
      }
      const topLevelProperty = patch.path[0];
      // Missing metadata, return true out of caution
      if (!metadata[topLevelProperty]) {
        return true;
      }
      return metadata[topLevelProperty].persist;
    });
  }
}
