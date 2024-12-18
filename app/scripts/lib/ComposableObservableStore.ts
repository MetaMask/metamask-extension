import { ObservableStore } from '@metamask/obs-store';
import {
  ActionConstraint,
  BaseState,
  ControllerMessenger,
  EventConstraint,
  getPersistentState,
  isBaseController,
  isBaseControllerV1,
} from '@metamask/base-controller';
import { getKnownPropertyNames } from '@metamask/utils';
import {
  MemStoreControllers,
  MemStoreControllersComposedState,
} from '../../../shared/types/metamask';

/**
 * An ObservableStore that can compose the state objects of its child stores and controllers
 */
export default class ComposableObservableStore extends ObservableStore<
  Partial<MemStoreControllersComposedState>
> {
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
    state = {},
    persist = false,
  }: {
    config?: MemStoreControllers;
    controllerMessenger: ControllerMessenger<ActionConstraint, EventConstraint>;
    state?: Partial<MemStoreControllersComposedState>;
    persist?: boolean;
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
   *   composed. The key is the name of the store, and the value is either a controller
   *   with an `ObservableStore`-type `store` propeety, or a controller that extends one of the two base
   *   controllers in the `@metamask/base-controller` package.
   */
  updateStructure(config: MemStoreControllers) {
    this.config = config;
    this.removeAllListeners();
    const initialState = getKnownPropertyNames(
      config,
    ).reduce<MemStoreControllersComposedState>(
      (composedState, controllerKey) => {
        const controller = config[controllerKey];
        if (!controller) {
          throw new Error(`Undefined '${controllerKey}'`);
        }

        if ('store' in controller && Boolean(controller.store?.subscribe)) {
          const { store } = controller;
          store.subscribe(
            (state: MemStoreControllersComposedState[typeof controllerKey]) => {
              this.#onStateChange(controllerKey, state);
            },
          );
          // @ts-expect-error TODO: Widen `isBaseControllerV1` input type to `unknown`
        } else if (isBaseControllerV1(controller)) {
          controller.subscribe((state) => {
            // @ts-expect-error V2 controller state excluded by type guard
            this.#onStateChange(controllerKey, state);
          });
        }
        // @ts-expect-error TODO: Widen `isBaseController{,V1}` input types to `unknown`
        if (isBaseController(controller) || isBaseControllerV1(controller)) {
          try {
            this.controllerMessenger.subscribe<`${typeof controller.name}:stateChange`>(
              `${controller.name}:stateChange`,
              // @ts-expect-error TODO: Fix `handler` being typed as `never` by defining `Global{Actions,Events}` types and supplying them to `MetamaskController['controllerMessenger']`
              (
                state: MemStoreControllersComposedState[typeof controllerKey],
              ) => {
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
          } catch (e) {
            throw new Error(
              `Cannot read properties of undefined (reading 'subscribe')`,
            );
          }
        }

        const controllerState =
          'store' in controller && 'subscribe' in controller.store
            ? controller.store.getState?.()
            : 'state' in controller
            ? controller.state
            : undefined;

        composedState[controllerKey] =
          this.persist && 'metadata' in controller && controller.metadata
            ? getPersistentState(controllerState, controller.metadata)
            : controllerState;
        return composedState;
      },
      {} as never,
    );
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
