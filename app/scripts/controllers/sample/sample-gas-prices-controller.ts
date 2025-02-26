import type {
  ControllerGetStateAction,
  ControllerStateChangeEvent,
  RestrictedMessenger,
  StateMetadata,
} from '@metamask/base-controller';
import { BaseController } from '@metamask/base-controller';
import type { Hex } from '@metamask/utils';

import type { NetworkControllerGetStateAction } from './network-controller-types';
import type { AbstractGasPricesService } from './sample-gas-prices-service';

// === GENERAL ===

/**
 * The name of the {@link SampleGasPricesController}, used to namespace the
 * controller's actions and events and to namespace the controller's state data
 * when composed with other controllers.
 */
export const controllerName = 'SampleGasPricesController';

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
 * Describes the shape of the state object for {@link SampleGasPricesController}.
 */
export type SampleGasPricesControllerState = {
  /**
   * The registry of pet names, categorized by chain ID first and address
   * second.
   */
  gasPricesByChainId: {
    [chainId: Hex]: GasPrices;
  };
};

/**
 * The metadata for each property in {@link SampleGasPricesControllerState}.
 */
const gasPricesControllerMetadata = {
  gasPricesByChainId: {
    persist: true,
    anonymous: false,
  },
} satisfies StateMetadata<SampleGasPricesControllerState>;

// === MESSENGER ===

/**
 * The action which can be used to retrieve the state of the
 * {@link SampleGasPricesController}.
 */
export type SampleGasPricesControllerGetStateAction = ControllerGetStateAction<
  typeof controllerName,
  SampleGasPricesControllerState
>;

/**
 * The action which can be used to update gas prices.
 */
export type SampleGasPricesControllerUpdateGasPricesAction = {
  type: `${typeof controllerName}:updateGasPrices`;
  handler: SampleGasPricesController['updateGasPrices'];
};

/**
 * All actions that {@link SampleGasPricesController} registers, to be called
 * externally.
 */
export type SampleGasPricesControllerActions =
  | SampleGasPricesControllerGetStateAction
  | SampleGasPricesControllerUpdateGasPricesAction;

/**
 * All actions that {@link SampleGasPricesController} calls internally.
 */
type AllowedActions = NetworkControllerGetStateAction;

/**
 * The event that {@link SampleGasPricesController} publishes when updating state.
 */
export type SampleGasPricesControllerStateChangeEvent =
  ControllerStateChangeEvent<
    typeof controllerName,
    SampleGasPricesControllerState
  >;

/**
 * All events that {@link SampleGasPricesController} publishes, to be subscribed to
 * externally.
 */
export type SampleGasPricesControllerEvents =
  SampleGasPricesControllerStateChangeEvent;

/**
 * All events that {@link SampleGasPricesController} subscribes to internally.
 */
type AllowedEvents = never;

/**
 * The messenger which is restricted to actions and events accessed by
 * {@link SampleGasPricesController}.
 */
export type SampleGasPricesControllerMessenger = RestrictedMessenger<
  typeof controllerName,
  SampleGasPricesControllerActions | AllowedActions,
  SampleGasPricesControllerEvents | AllowedEvents,
  AllowedActions['type'],
  AllowedEvents['type']
>;

/**
 * Constructs the default {@link SampleGasPricesController} state. This allows
 * consumers to provide a partial state object when initializing the controller
 * and also helps in constructing complete state objects for this controller in
 * tests.
 *
 * @returns The default {@link SampleGasPricesController} state.
 */
export function getDefaultSampleGasPricesControllerState(): SampleGasPricesControllerState {
  return {
    gasPricesByChainId: {},
  };
}

// === CONTROLLER DEFINITION ===

/**
 * `SampleGasPricesController` fetches and persists gas prices for various chains.
 *
 * @example
 *
 * ``` ts
 * import { Messenger } from '@metamask/base-controller';
 * import {
 *   SampleGasPricesController,
 *   SampleGasPricesService
 * } from '@metamask/example-controllers';
 * import type {
 *   SampleGasPricesControllerActions,
 *   SampleGasPricesControllerEvents
 * } from '@metamask/example-controllers';
 * import type { NetworkControllerGetStateAction } from '@metamask/network-controller';
 *
 * // Assuming that you're using this in the browser
 * const gasPricesService = new SampleGasPricesService({ fetch });
 * const rootMessenger = new Messenger<
 *  SampleGasPricesControllerActions | NetworkControllerGetStateAction,
 *  SampleGasPricesControllerEvents
 * >();
 * const gasPricesMessenger = rootMessenger.getRestricted({
 *   name: 'SampleGasPricesController',
 *   allowedActions: ['NetworkController:getState'],
 *   allowedEvents: [],
 * });
 * const gasPricesController = new SampleGasPricesController({
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
export class SampleGasPricesController extends BaseController<
  typeof controllerName,
  SampleGasPricesControllerState,
  SampleGasPricesControllerMessenger
> {
  /**
   * The service object that is used to obtain gas prices.
   */
  readonly #gasPricesService: AbstractGasPricesService;

  /**
   * Constructs a new {@link SampleGasPricesController}.
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
    messenger: SampleGasPricesControllerMessenger;
    state?: Partial<SampleGasPricesControllerState>;
    gasPricesService: AbstractGasPricesService;
  }) {
    super({
      messenger,
      metadata: gasPricesControllerMetadata,
      name: controllerName,
      state: {
        ...getDefaultSampleGasPricesControllerState(),
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
