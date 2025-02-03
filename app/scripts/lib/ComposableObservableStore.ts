import { ObservableStore } from '@metamask/obs-store';
import {
  ActionConstraint,
  BaseControllerInstance,
  ControllerMessenger,
  EventConstraint,
  getPersistentState,
  isBaseController,
  StateConstraint,
  StateMetadata,
} from '@metamask/base-controller';
import { getKnownPropertyNames } from '@metamask/utils';
import {
  MemStoreControllers,
  StoreControllers,
} from '../../../shared/types/background';

type Controllers = MemStoreControllers &
  Partial<Pick<StoreControllers, 'PhishingController'>>;

/**
 * An ObservableStore that can compose the state objects of its child stores and controllers
 */
export default class ComposableObservableStore<
  Config extends Record<
    string,
    Omit<BaseControllerInstance, 'metadata'> & {
      state: StateConstraint;
      metadata: StateMetadata<Config[keyof Config]['state']>;
    }
  > = Controllers,
  ComposedState extends Record<keyof Config, StateConstraint> = {
    [ControllerName in keyof Config]: Config[ControllerName]['state'];
  },
> extends ObservableStore<ComposedState> {
  /**
   * Describes which stores are being composed. The key is the name of the
   * store, and the value is either an ObservableStore, or a controller that
   * extends one of the two base controllers in the `@metamask/base-controller`
   * package.
   */
  config: Partial<Config> = {};

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
    config?: Config;
    controllerMessenger: ControllerMessenger<ActionConstraint, EventConstraint>;
    state?: Partial<ComposedState>;
    persist?: boolean;
  }) {
    super(state as ComposedState);
    this.persist = persist;
    this.controllerMessenger = controllerMessenger;
    if (config) {
      this.updateStructure(config);
    }
  }

  /**
   * Composes a new internal store subscription structure
   *
   * @param config - Describes which stores are being
   * composed. The key is the name of the store, and the value is either a controller
   * with an `ObservableStore`-type `store` propeety, or a controller that extends one of the two base
   * controllers in the `@metamask/base-controller` package.
   */
  updateStructure<NewConfig extends Partial<Config>>(config: NewConfig) {
    this.config = config;
    this.removeAllListeners();
    const initialState = getKnownPropertyNames(config).reduce<ComposedState>(
      (composedState, controllerKey) => {
        const controller = config[controllerKey];
        if (!controller) {
          throw new Error(`Undefined '${String(controllerKey)}'`);
        }

        if (isBaseController(controller)) {
          try {
            this.controllerMessenger.subscribe<`${typeof controller.name}:stateChange`>(
              `${controller.name}:stateChange`,
              // @ts-expect-error TODO: Fix `handler` being typed as `never` by defining `Global{Actions,Events}` types and supplying them to `MetamaskController['controllerMessenger']`
              (state: ComposedState[typeof controllerKey]) => {
                let updatedState: Partial<ComposedState[typeof controllerKey]> =
                  state;
                if (this.persist && 'metadata' in controller) {
                  updatedState = getPersistentState<
                    ComposedState[typeof controllerKey]
                  >(
                    state,
                    controller.metadata as StateMetadata<
                      ComposedState[typeof controllerKey]
                    >,
                  ) as Partial<ComposedState[typeof controllerKey]>;
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

        composedState[controllerKey] =
          this.persist && controller.metadata
            ? (getPersistentState<ComposedState[typeof controllerKey]>(
                controller.state as ComposedState[typeof controllerKey],
                controller.metadata as StateMetadata<
                  ComposedState[typeof controllerKey]
                >,
              ) as ComposedState[typeof controllerKey])
            : (controller.state as ComposedState[typeof controllerKey]);
        return composedState;
      },
      {} as never,
    );
    this.updateState(initialState);
  }

  #onStateChange(
    controllerKey: keyof Config,
    newState: Partial<ComposedState[typeof controllerKey]>,
  ) {
    const oldState = this.getState()[controllerKey];

    this.updateState({ [controllerKey]: newState } as Partial<ComposedState>);

    this.emit('stateChange', { oldState, newState, controllerKey });
  }
}
