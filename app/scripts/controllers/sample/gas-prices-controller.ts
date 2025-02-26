import type {
  ControllerGetStateAction,
  ControllerStateChangeEvent,
  RestrictedMessenger,
  StateMetadata,
} from '@metamask/base-controller';
import { BaseController } from '@metamask/base-controller';
import type { Hex } from '@metamask/utils';

import type { AbstractGasPricesService } from './gas-prices-service/abstract-gas-prices-service';
import type { NetworkControllerGetStateAction } from './network-controller-types';

// === GENERAL ===

/**
 * The name of the {@link GasPricesController}, used to namespace the
 * controller's actions and events and to namespace the controller's state data
 * when composed with other controllers.
 */
export const controllerName = 'GasPricesController';

// === STATE ===

/**
 * The collection of gas price data fetched periodically.
 */
type GasPrices = {
  /**
   * The total estimated gas in the "low" bucket.
   */
  low: number;
  /**
   * The total estimated gas in the "average" bucket.
   */
  average: number;
  /**
   * The total estimated gas in the "high" bucket.
   */
  high: number;
  /**
   * The date/time (in ISO-8601 format) when prices were fetched.
   */
  fetchedDate: string;
};

/**
 * Describes the shape of the state object for {@link GasPricesController}.
 */
export type GasPricesControllerState = {
  /**
   * The registry of pet names, categorized by chain ID first and address
   * second.
   */
  gasPricesByChainId: {
    [chainId: Hex]: GasPrices;
  };
};

/**
 * The metadata for each property in {@link GasPricesControllerState}.
 */
const gasPricesControllerMetadata = {
  gasPricesByChainId: {
    persist: true,
    anonymous: false,
  },
} satisfies StateMetadata<GasPricesControllerState>;

// === MESSENGER ===

/**
 * The action which can be used to retrieve the state of the
 * {@link GasPricesController}.
 */
export type GasPricesControllerGetStateAction = ControllerGetStateAction<
  typeof controllerName,
  GasPricesControllerState
>;

/**
 * The action which can be used to update gas prices.
 */
export type GasPricesControllerUpdateGasPricesAction = {
  type: `${typeof controllerName}:updateGasPrices`;
  handler: GasPricesController['updateGasPrices'];
};

/**
 * All actions that {@link GasPricesController} registers, to be called
 * externally.
 */
export type GasPricesControllerActions =
  | GasPricesControllerGetStateAction
  | GasPricesControllerUpdateGasPricesAction;

/**
 * All actions that {@link GasPricesController} calls internally.
 */
type AllowedActions = NetworkControllerGetStateAction;

/**
 * The event that {@link GasPricesController} publishes when updating state.
 */
export type GasPricesControllerStateChangeEvent = ControllerStateChangeEvent<
  typeof controllerName,
  GasPricesControllerState
>;

/**
 * All events that {@link GasPricesController} publishes, to be subscribed to
 * externally.
 */
export type GasPricesControllerEvents = GasPricesControllerStateChangeEvent;

/**
 * All events that {@link GasPricesController} subscribes to internally.
 */
type AllowedEvents = never;

/**
 * The messenger which is restricted to actions and events accessed by
 * {@link GasPricesController}.
 */
export type GasPricesControllerMessenger = RestrictedMessenger<
  typeof controllerName,
  GasPricesControllerActions | NetworkControllerGetStateAction,
  GasPricesControllerEvents,
  NetworkControllerGetStateAction['type'],
  string
>;

/**
 * Constructs the default {@link GasPricesController} state. This allows
 * consumers to provide a partial state object when initializing the controller
 * and also helps in constructing complete state objects for this controller in
 * tests.
 *
 * @returns The default {@link GasPricesController} state.
 */
export function getDefaultGasPricesControllerState(): GasPricesControllerState {
  return {
    gasPricesByChainId: {},
  };
}

// === CONTROLLER DEFINITION ===

/**
 * `GasPricesController` fetches and persists gas prices for various chains.
 *
 * @example
 *
 * ``` ts
 * import { Messenger } from '@metamask/base-controller';
 * import {
 *   GasPricesController,
 *   GasPricesService
 * } from '@metamask/example-controllers';
 * import type {
 *   GasPricesControllerActions,
 *   GasPricesControllerEvents
 * } from '@metamask/example-controllers';
 * import type { NetworkControllerGetStateAction } from '@metamask/network-controller';
 *
 * // Assuming that you're using this in the browser
 * const gasPricesService = new GasPricesService({ fetch });
 * const rootMessenger = new Messenger<
 *  GasPricesControllerActions | NetworkControllerGetStateAction,
 *  GasPricesControllerEvents
 * >();
 * const gasPricesMessenger = rootMessenger.getRestricted({
 *   name: 'GasPricesController',
 *   allowedActions: ['NetworkController:getState'],
 *   allowedEvents: [],
 * });
 * const gasPricesController = new GasPricesController({
 *   messenger: gasPricesMessenger,
 *   gasPricesService,
 * });
 *
 * // Assuming that `NetworkController:getState` returns an object with a
 * // `chainId` of `0x42`...
 * await gasPricesController.updateGasPrices();
 * gasPricesController.state.gasPricesByChainId
 * // => { '0x42': { low: 5, average: 10, high: 15, fetchedDate: '2024-01-02T00:00:00.000Z' } }
 * ```
 */
export class GasPricesController extends BaseController<
  typeof controllerName,
  GasPricesControllerState,
  GasPricesControllerMessenger
> {
  /**
   * The service object that is used to obtain gas prices.
   */
  readonly #gasPricesService: AbstractGasPricesService;

  /**
   * Constructs a new {@link GasPricesController}.
   *
   * @param args - The arguments to the controller.
   * @param args.messenger - The messenger suited for this controller.
   * @param args.state - The desired state with which to initialize this
   * controller. Missing properties will be filled in with defaults.
   * @param args.gasPricesService - The service object that will be used to
   * obtain gas prices.
   */
  constructor({
    messenger,
    state,
    gasPricesService,
  }: {
    messenger: GasPricesControllerMessenger;
    state?: Partial<GasPricesControllerState>;
    gasPricesService: AbstractGasPricesService;
  }) {
    super({
      messenger,
      metadata: gasPricesControllerMetadata,
      name: controllerName,
      state: {
        ...getDefaultGasPricesControllerState(),
        ...state,
      },
    });

    this.#gasPricesService = gasPricesService;

    this.messagingSystem.registerActionHandler(
      `${controllerName}:updateGasPrices`,
      this.updateGasPrices.bind(this),
    );
  }

  /**
   * Fetches the latest gas prices for the current chain, persisting them to
   * state.
   */
  async updateGasPrices() {
    const { chainId } = this.messagingSystem.call('NetworkController:getState');
    const gasPricesResponse = await this.#gasPricesService.fetchGasPrices(
      chainId,
    );
    this.update((state) => {
      state.gasPricesByChainId[chainId] = {
        ...gasPricesResponse,
        fetchedDate: new Date().toISOString(),
      };
    });
  }
}
