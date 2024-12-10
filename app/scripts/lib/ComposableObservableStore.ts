import { ObservableStore } from '@metamask/obs-store';
import {
  ActionConstraint,
  ControllerMessenger,
  EventConstraint,
  getPersistentState,
} from '@metamask/base-controller';
import { getKnownPropertyNames } from '@metamask/utils';
import {
  BackgroundStateProxy,
  MemStoreControllers,
  MemStoreControllersComposedState,
} from '../../../shared/types/metamask';

/**
 * An ObservableStore that can compose the state objects of its child stores and controllers
 */
export default class ComposableObservableStore extends ObservableStore<BackgroundStateProxy> {
  /**
   * Describes which stores are being composed. The key is the name of the
   * store, and the value is either an ObservableStore, or a controller that
   * extends one of the two base controllers in the `@metamask/base-controller`
   * package.
   */
  config: Partial<MemStoreControllers> = {};
  controllerMessenger: ControllerMessenger<ActionConstraint, EventConstraint>;
  persist: boolean;

  /**
   * Create a new store
   *
   * @param options
   * @param [options.config] - Map of internal state keys to child stores and controllers
   * @param options.controllerMessenger - The controller messenger, used for subscribing to events from BaseControllerV2-based controllers.
   * @param [options.state] - The composed state of the child stores and controllers
   * @param [options.persist] - Whether or not to apply the persistence for v2 controllers
   */
  constructor({
    config,
    controllerMessenger,
    state,
    persist,
  }: {
    config: MemStoreControllers;
    controllerMessenger: ControllerMessenger<ActionConstraint, EventConstraint>;
    state: BackgroundStateProxy;
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
  updateStructure(config: MemStoreControllers) {
    this.config = config;
    this.removeAllListeners();
    const initialState = {};
    for (const controllerKey of getKnownPropertyNames(config)) {
      const controller = config[controllerKey];
      if (!controller) {
        throw new Error(`Undefined '${controllerKey}'`);
      }

      if ('store' in controller && 'subscribe' in controller.store) {
        const { store } = controller;
        store.subscribe(
          (state: MemStoreControllersComposedState[typeof controllerKey]) => {
            this.#onStateChange(controllerKey, state);
          },
        );
      } else {
        this.controllerMessenger.subscribe<`${typeof controllerKey}:stateChange`>(
          `${controllerKey}:stateChange`,
          // @ts-expect-error TODO: Fix `handler` being typed as `never` by defining `Global{Actions,Events}` types and supplying them to `MetamaskController['controllerMessenger']`
          (state: MemStoreControllersComposedState[typeof controllerKey]) => {
            let updatedState: Partial<
              MemStoreControllersComposedState[typeof controllerKey]
            > = state;
            if (this.persist && 'metadata' in controller) {
              updatedState = getPersistentState(
                // @ts-expect-error No state object can be passed into this parameter because its type is wider than all V2 state objects.
                // TODO: Fix this parameter's type to be the widest subtype of V2 controller state types instead of their supertype/constraint.
                state,
                controller.metadata,
              ) as Partial<
                MemStoreControllersComposedState[typeof controllerKey]
              >;
            }
            this.#onStateChange(controllerKey, updatedState);
          },
        );
      }

      const initialState =
        'store' in controller && 'subscribe' in controller.store
          ? controller.store.getState?.()
          : 'state' in controller
          ? controller.state
          : undefined;

      initialState[controllerKey] =
        this.persist && 'metadata' in controller && controller.metadata
          ? getPersistentState(initialState, controller.metadata)
          : initialState;
    }
    this.updateState(initialState);
  }

  #onStateChange(
    controllerKey: keyof MemStoreControllers,
    newState: Partial<MemStoreControllersComposedState[typeof controllerKey]>,
  ) {
    const oldState = this.getState()[controllerKey];

    this.updateState({ [controllerKey]: newState });

    this.emit('stateChange', { oldState, newState, controllerKey });
  }
}
