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
 * The name of the {@link PetNamesController}, used to namespace the
 * controller's actions and events and to namespace the controller's state data
 * when composed with other controllers.
 */
export const controllerName = 'PetNamesController';

// === STATE ===

/**
 * Describes the shape of the state object for {@link PetNamesController}.
 */
export type PetNamesControllerState = {
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
 * The metadata for each property in {@link PetNamesControllerState}.
 */
const petNamesControllerMetadata = {
  namesByChainIdAndAddress: {
    persist: true,
    anonymous: false,
  },
} satisfies StateMetadata<PetNamesControllerState>;

// === MESSENGER ===

/**
 * The action which can be used to retrieve the state of the
 * {@link PetNamesController}.
 */
export type PetNamesControllerGetStateAction = ControllerGetStateAction<
  typeof controllerName,
  PetNamesControllerState
>;

export type PetNamesControllerAssignPetNameAction = {
  type: `${typeof controllerName}:assignPetName`;
  handler: PetNamesController['assignPetName'];
};

/**
 * All actions that {@link PetNamesController} registers, to be called
 * externally.
 */
export type PetNamesControllerActions =
  | PetNamesControllerGetStateAction
  | PetNamesControllerAssignPetNameAction;

/**
 * The event that {@link PetNamesController} publishes when updating state.
 */
export type PetNamesControllerStateChangeEvent = ControllerStateChangeEvent<
  typeof controllerName,
  PetNamesControllerState
>;

/**
 * All events that {@link PetNamesController} publishes, to be subscribed to
 * externally.
 */
export type PetNamesControllerEvents = PetNamesControllerStateChangeEvent;

/**
 * The messenger which is restricted to actions and events accessed by
 * {@link PetNamesController}.
 */
export type PetNamesControllerMessenger = RestrictedMessenger<
  typeof controllerName,
  PetNamesControllerActions,
  PetNamesControllerEvents,
  string,
  string
>;

/**
 * Constructs the default {@link PetNamesController} state. This allows
 * consumers to provide a partial state object when initializing the controller
 * and also helps in constructing complete state objects for this controller in
 * tests.
 *
 * @returns The default {@link PetNamesController} state.
 */
export function getDefaultPetNamesControllerState(): PetNamesControllerState {
  return {
    namesByChainIdAndAddress: {},
  };
}

// === CONTROLLER DEFINITION ===

/**
 * `PetNamesController` records user-provided nicknames for various addresses on
 * various chains.
 *
 * @example
 *
 * ``` ts
 * import { Messenger } from '@metamask/base-controller';
 * import type {
 *   PetNamesControllerActions,
 *   PetNamesControllerEvents
 * } from '@metamask/example-controllers';
 *
 * const rootMessenger = new Messenger<
 *  PetNamesControllerActions,
 *  PetNamesControllerEvents
 * >();
 * const petNamesMessenger = rootMessenger.getRestricted({
 *   name: 'PetNamesController',
 *   allowedActions: [],
 *   allowedEvents: [],
 * });
 * const petNamesController = new GasPricesController({
 *   messenger: petNamesMessenger,
 * });
 *
 * petNamesController.assignPetName(
 *   '0x1',
 *   '0xF57F855e17483B1f09bFec62783C9d3b6c8b3A99',
 *   'Primary Account'
 * );
 * petNamesController.state.namesByChainIdAndAddress
 * // => { '0x1': { '0xF57F855e17483B1f09bFec62783C9d3b6c8b3A99': 'Primary Account' } }
 * ```
 */
export class PetNamesController extends BaseController<
  typeof controllerName,
  PetNamesControllerState,
  PetNamesControllerMessenger
> {
  /**
   * Constructs a new {@link PetNamesController}.
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
    messenger: PetNamesControllerMessenger;
    state?: Partial<PetNamesControllerState>;
  }) {
    super({
      messenger,
      metadata: petNamesControllerMetadata,
      name: controllerName,
      state: {
        ...getDefaultPetNamesControllerState(),
        ...state,
      },
    });

    this.messagingSystem.registerActionHandler(
      `${controllerName}:assignPetName`,
      this.assignPetName.bind(this),
    );
  }

  /**
   * Registers the given name with the given address (relative to the given
   * chain).
   *
   * @param chainId - The chain ID that the address belongs to.
   * @param address - The account address to name.
   * @param name - The name to assign to the address.
   */
  assignPetName(chainId: Hex, address: Hex, name: string) {
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
