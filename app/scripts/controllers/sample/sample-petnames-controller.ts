import type {
  ControllerGetStateAction,
  ControllerStateChangeEvent,
  RestrictedMessenger,
  StateMetadata,
} from '@metamask/base-controller';
import { BaseController } from '@metamask/base-controller';
import { isSafeDynamicKey } from '@metamask/controller-utils';
import type { Hex } from '@metamask/utils';

// === GENERAL ===

/**
 * The name of the {@link SamplePetnamesController}, used to namespace the
 * controller's actions and events and to namespace the controller's state data
 * when composed with other controllers.
 */
export const controllerName = 'SamplePetnamesController';

// === STATE ===

/**
 * Describes the shape of the state object for {@link SamplePetnamesController}.
 */
export type SamplePetnamesControllerState = {
  /**
   * The registry of pet names, categorized by chain ID first and address
   * second.
   */
  namesByChainIdAndAddress: {
    [chainId: Hex]: {
      [address: Hex]: string;
    };
  };
};

/**
 * The metadata for each property in {@link SamplePetnamesControllerState}.
 */
const samplePetnamesControllerMetadata = {
  namesByChainIdAndAddress: {
    persist: true,
    anonymous: false,
  },
} satisfies StateMetadata<SamplePetnamesControllerState>;

// === MESSENGER ===

/**
 * The action which can be used to retrieve the state of the
 * {@link SamplePetnamesController}.
 */
export type SamplePetnamesControllerGetStateAction = ControllerGetStateAction<
  typeof controllerName,
  SamplePetnamesControllerState
>;

/**
 * All actions that {@link SamplePetnamesController} registers, to be called
 * externally.
 */
export type SamplePetnamesControllerActions =
  SamplePetnamesControllerGetStateAction;

/**
 * All actions that {@link SamplePetnamesController} calls internally.
 */
type AllowedActions = never;

/**
 * The event that {@link SamplePetnamesController} publishes when updating state.
 */
export type SamplePetnamesControllerStateChangeEvent =
  ControllerStateChangeEvent<
    typeof controllerName,
    SamplePetnamesControllerState
  >;

/**
 * All events that {@link SamplePetnamesController} publishes, to be subscribed to
 * externally.
 */
export type SamplePetnamesControllerEvents =
  SamplePetnamesControllerStateChangeEvent;

/**
 * All events that {@link SamplePetnamesController} subscribes to internally.
 */
type AllowedEvents = never;

/**
 * The messenger which is restricted to actions and events accessed by
 * {@link SamplePetnamesController}.
 */
export type SamplePetnamesControllerMessenger = RestrictedMessenger<
  typeof controllerName,
  SamplePetnamesControllerActions | AllowedActions,
  SamplePetnamesControllerEvents | AllowedEvents,
  AllowedActions['type'],
  AllowedEvents['type']
>;

/**
 * Constructs the default {@link SamplePetnamesController} state. This allows
 * consumers to provide a partial state object when initializing the controller
 * and also helps in constructing complete state objects for this controller in
 * tests.
 *
 * @returns The default {@link SamplePetnamesController} state.
 */
function getDefaultPetnamesControllerState(): SamplePetnamesControllerState {
  return {
    namesByChainIdAndAddress: {},
  };
}

// === CONTROLLER DEFINITION ===

/**
 * `SamplePetnamesController` records user-provided nicknames for various addresses on
 * various chains.
 *
 * @example
 *
 * ``` ts
 * import { Messenger } from '@metamask/base-controller';
 * import type {
 *   SamplePetnamesControllerActions,
 *   SamplePetnamesControllerEvents
 * } from '@metamask/example-controllers';
 *
 * const rootMessenger = new Messenger<
 *  SamplePetnamesControllerActions,
 *  SamplePetnamesControllerEvents
 * >();
 * const samplePetnamesMessenger = rootMessenger.getRestricted({
 *   name: 'SamplePetnamesController',
 *   allowedActions: [],
 *   allowedEvents: [],
 * });
 * const samplePetnamesController = new SamplePetnamesController({
 *   messenger: samplePetnamesMessenger,
 * });
 *
 * samplePetnamesController.assignPetname(
 *   '0x1',
 *   '0xF57F855e17483B1f09bFec62783C9d3b6c8b3A99',
 *   'Primary Account'
 * );
 * samplePetnamesController.state.namesByChainIdAndAddress
 * // => { '0x1': { '0xF57F855e17483B1f09bFec62783C9d3b6c8b3A99': 'Primary Account' } }
 * ```
 */
export class SamplePetnamesController extends BaseController<
  typeof controllerName,
  SamplePetnamesControllerState,
  SamplePetnamesControllerMessenger
> {
  /**
   * Constructs a new {@link SamplePetnamesController}.
   *
   * @param args - The arguments to the controller.
   * @param args.messenger - The messenger suited for this controller.
   * @param args.state - The desired state with which to initialize this
   * controller. Missing properties will be filled in with defaults.
   */
  constructor({
    messenger,
    state,
  }: {
    messenger: SamplePetnamesControllerMessenger;
    state?: Partial<SamplePetnamesControllerState>;
  }) {
    super({
      messenger,
      metadata: samplePetnamesControllerMetadata,
      name: controllerName,
      state: {
        ...getDefaultPetnamesControllerState(),
        ...state,
      },
    });
  }

  /**
   * Registers the given name with the given address (relative to the given
   * chain).
   *
   * @param chainId - The chain ID that the address belongs to.
   * @param address - The account address to name.
   * @param name - The name to assign to the address.
   */
  assignPetname(chainId: Hex, address: Hex, name: string) {
    if (!isSafeDynamicKey(chainId)) {
      throw new Error('Invalid chain ID');
    }

    const normalizedAddress = address.toLowerCase() as Hex;

    this.update((state) => {
      state.namesByChainIdAndAddress[chainId] ??= {};
      state.namesByChainIdAndAddress[chainId][normalizedAddress] = name;
    });
  }
}
