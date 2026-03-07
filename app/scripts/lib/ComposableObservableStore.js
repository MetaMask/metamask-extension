import { ObservableStore } from '@metamask/obs-store';
import { deriveStateFromMetadata } from '@metamask/base-controller';

const { hasOwnProperty } = Object.prototype;

function getPersistentState(state, metadata) {
  return deriveStateFromMetadata(state, metadata, 'persist');
}

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
   * Snapshot of the merged controller state.
   *
   * @type {Record<string, unknown>}
   */
  #flatState = {};

  /**
   * Tracks the controller that currently owns each flattened key.
   *
   * @type {Map<string, string>}
   */
  #keyAssignments = new Map();

  /**
   * Ordered list of controller keys for priority evaluation.
   *
   * @type {string[]}
   */
  #controllerOrder = [];

  /**
   * Cached lookup from controller key to its priority index.
   *
   * @type {Map<string, number>}
   */
  #controllerPriority = new Map();

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
    this.#controllerOrder = Object.keys(config ?? {});
    this.#controllerPriority = new Map(
      this.#controllerOrder.map((key, index) => [key, index]),
    );
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
                patches,
              );
            }
          },
        );
      } else {
        this.controllerMessenger.subscribe(
          `${store.name}:stateChange`,
          (state, patches) => this.#onStateChange(key, state, patches),
        );
      }

      const initialStoreState = store.state ?? store.getState?.();

      initialState[key] =
        this.persist && config[key].metadata
          ? getPersistentState(initialStoreState, config[key].metadata)
          : initialStoreState;
    }
    this.updateState(initialState);
    this.#rebuildFlatStateCache(this.getState());
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
    return { ...this.#flatState };
  }

  #onStateChange(controllerKey, newState, patches) {
    const oldState = this.getState()[controllerKey];

    this.updateState({ [controllerKey]: newState });
    const composedState = this.getState();
    this.#applyStateDiff(controllerKey, oldState, newState, composedState);

    this.emit('stateChange', { controllerKey, newState, oldState, patches });
  }

  #applyStateDiff(controllerKey, oldState, newState, composedState) {
    if (!this.#controllerPriority.has(controllerKey)) {
      return;
    }

    const normalizedOldState = this.#normalizeStateSnapshot(oldState);
    const normalizedNewState = this.#normalizeStateSnapshot(newState);

    if (normalizedOldState) {
      for (const key of Object.keys(normalizedOldState)) {
        if (!normalizedNewState || !hasOwnProperty.call(normalizedNewState, key)) {
          this.#handleKeyRemoval(controllerKey, key, composedState);
        }
      }
    }

    if (!normalizedNewState) {
      return;
    }

    for (const [key, value] of Object.entries(normalizedNewState)) {
      this.#handleKeyUpsert(controllerKey, key, value);
    }
  }

  #handleKeyRemoval(controllerKey, key, composedState) {
    if (this.#keyAssignments.get(key) !== controllerKey) {
      return;
    }

    const fallback = this.#findReplacementOwner(key, controllerKey, composedState);
    if (fallback) {
      this.#keyAssignments.set(key, fallback.controllerKey);
      this.#flatState[key] = fallback.value;
      return;
    }

    this.#keyAssignments.delete(key);
    delete this.#flatState[key];
  }

  #findReplacementOwner(key, excludedControllerKey, composedState) {
    for (let index = this.#controllerOrder.length - 1; index >= 0; index -= 1) {
      const candidateKey = this.#controllerOrder[index];
      if (candidateKey === excludedControllerKey) {
        continue;
      }
      const candidateState = this.#normalizeStateSnapshot(
        composedState?.[candidateKey],
      );
      if (candidateState && hasOwnProperty.call(candidateState, key)) {
        return {
          controllerKey: candidateKey,
          value: candidateState[key],
        };
      }
    }
    return undefined;
  }

  #handleKeyUpsert(controllerKey, key, value) {
    if (!this.#controllerPriority.has(controllerKey)) {
      return;
    }

    const currentOwner = this.#keyAssignments.get(key);
    if (currentOwner === controllerKey) {
      this.#flatState[key] = value;
      return;
    }

    const currentPriority =
      currentOwner === undefined
        ? -1
        : this.#controllerPriority.get(currentOwner) ?? -1;
    const incomingPriority = this.#controllerPriority.get(controllerKey) ?? -1;

    if (currentOwner === undefined || incomingPriority > currentPriority) {
      this.#keyAssignments.set(key, controllerKey);
      this.#flatState[key] = value;
    }
  }

  #rebuildFlatStateCache(composedState) {
    this.#flatState = {};
    this.#keyAssignments = new Map();

    if (!this.config) {
      return;
    }

    for (const controllerKey of this.#controllerOrder) {
      const snapshot = this.#normalizeStateSnapshot(composedState?.[controllerKey]);
      if (!snapshot) {
        continue;
      }
      for (const [stateKey, value] of Object.entries(snapshot)) {
        this.#keyAssignments.set(stateKey, controllerKey);
        this.#flatState[stateKey] = value;
      }
    }
  }

  #normalizeStateSnapshot(state) {
    if (state === null || state === undefined) {
      return undefined;
    }

    return typeof state === 'object' ? state : Object(state);
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
