import {
  BaseController,
  type ControllerGetStateAction,
  type ControllerStateChangeEvent,
  type RestrictedControllerMessenger,
} from '@metamask/base-controller';
import type { NetworkControllerSetActiveNetworkAction, NetworkControllerGetStateAction, NetworkControllerStateChangeEvent } from '@metamask/network-controller';

const controllerName = 'MultichainNetworkController';

/**
 * State used by the {@link MultichainNetworkController} to cache network configurations.
 */
export type MultichainNetworkControllerState = {};

/**
 * Default state of the {@link MultichainNetworkController}.
 */
export const defaultState: MultichainNetworkControllerState = {};

/**
 * Returns the state of the {@link MultichainNetworkController}.
 */
export type MultichainNetworkControllerGetStateAction = ControllerGetStateAction<
  typeof controllerName,
  MultichainNetworkControllerState
>;

/**
 * Event emitted when the state of the {@link MultichainNetworkController} changes.
 */
export type MultichainNetworkStateControllerStateChange = ControllerStateChangeEvent<
  typeof controllerName,
  MultichainNetworkControllerState
>;

/**
 * Actions exposed by the {@link MultichainNetworkController}.
 */
export type MultichainNetworkStateControllerActions =
  | MultichainNetworkControllerGetStateAction

/**
 * Events emitted by {@link MultichainNetworkController}.
 */
export type MultichainNetworkControllerEvents = MultichainNetworkStateControllerStateChange;

/**
 * Actions that this controller is allowed to call.
 */
export type AllowedActions = NetworkControllerSetActiveNetworkAction | NetworkControllerGetStateAction;

/**
 * Events that this controller is allowed to subscribe.
 */
export type AllowedEvents = NetworkControllerStateChangeEvent;

/**
 * Messenger type for the MultichainNetworkController.
 */
export type MultichainNetworkControllerMessenger = RestrictedControllerMessenger<
  typeof controllerName,
  MultichainNetworkStateControllerActions | AllowedActions,
  MultichainNetworkControllerEvents | AllowedEvents,
  AllowedActions['type'],
  AllowedEvents['type']
>;

/**
 * {@link MultichainNetworkController}'s metadata.
 *
 * This allows us to choose if fields of the state should be persisted or not
 * using the `persist` flag; and if they can be sent to Sentry or not, using
 * the `anonymous` flag.
 */
const multichainNetworkControllerMetadata = {};

/**
 * The MultichainNetworkController is responsible for fetching and caching account
 * balances.
 */
export class MultichainNetworkController extends BaseController<
  typeof controllerName,
  MultichainNetworkControllerState,
  MultichainNetworkControllerMessenger
> {

  constructor({
    messenger,
    state,
  }: {
    messenger: MultichainNetworkControllerMessenger;
    state: MultichainNetworkControllerState;
  }) {
    super({
      messenger,
      name: controllerName,
      metadata: multichainNetworkControllerMetadata,
      state: {
        ...defaultState,
        ...state,
      },
    });
  }


}
