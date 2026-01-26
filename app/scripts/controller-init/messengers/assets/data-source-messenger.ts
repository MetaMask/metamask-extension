import { Messenger } from '@metamask/messenger';
import { RootMessenger } from '../../../lib/messenger';

// Actions that data sources need access to
// Note: Data sources now use ApiPlatformClient directly (not via messenger)
type DataSourceAllowedActions =
  | { type: 'NetworkController:getState'; handler: () => unknown }
  | {
      type: 'NetworkController:getNetworkClientById';
      handler: (id: string) => unknown;
    }
  | {
      type: 'BackendWebSocketService:subscribe';
      handler: (...args: unknown[]) => unknown;
    }
  | {
      type: 'BackendWebSocketService:unsubscribe';
      handler: (...args: unknown[]) => unknown;
    }
  | { type: 'BackendWebSocketService:getState'; handler: () => unknown }
  | { type: 'AssetsController:getState'; handler: () => unknown };

// Events that data sources need to subscribe to
type DataSourceAllowedEvents =
  | { type: 'NetworkController:stateChange'; payload: [unknown] }
  | { type: 'BackendWebSocketService:stateChange'; payload: [unknown] }
  | { type: 'AccountsApiDataSource:activeChainsChanged'; payload: [unknown] };

// Actions needed during initialization (for ApiPlatformClient)
type DataSourceInitAllowedActions = {
  type: 'AuthenticationController:getBearerToken';
  handler: () => Promise<string | undefined>;
};

// Events needed during initialization (for auth state changes)
type DataSourceInitAllowedEvents = {
  type: 'AuthenticationController:stateChange';
  payload: [{ isSignedIn: boolean }];
};

/**
 * Messenger type for DataSource initialization.
 * This messenger needs broad access since it creates child messengers internally.
 */
export type DataSourceMessenger = RootMessenger<
  DataSourceAllowedActions,
  DataSourceAllowedEvents
>;

/**
 * Messenger type for DataSource init function (for getting bearer token and auth events).
 */
export type DataSourceInitMessenger = ReturnType<
  typeof getDataSourceInitMessenger
>;

/**
 * Get the messenger for DataSource initialization.
 *
 * The data sources use their own internal messenger hierarchy, so we return
 * the base messenger to allow them to create child messengers with proper
 * action/event delegation.
 *
 * @param baseMessenger - The base controller messenger
 * @returns The messenger for data source initialization
 */
export function getDataSourceMessenger(
  baseMessenger: RootMessenger,
): DataSourceMessenger {
  // Return the base messenger - data sources will create their own child messengers
  // with proper delegation internally via initMessengers()
  return baseMessenger as DataSourceMessenger;
}

/**
 * Get the init messenger for DataSource initialization.
 *
 * This messenger is used to get the bearer token during ApiPlatformClient setup
 * and subscribe to auth state changes.
 *
 * @param messenger - The root controller messenger
 * @returns The restricted messenger for data source init
 */
export function getDataSourceInitMessenger(
  messenger: RootMessenger<
    DataSourceInitAllowedActions,
    DataSourceInitAllowedEvents
  >,
) {
  const controllerInitMessenger = new Messenger<
    'DataSourceInit',
    DataSourceInitAllowedActions,
    DataSourceInitAllowedEvents,
    typeof messenger
  >({
    namespace: 'DataSourceInit',
    parent: messenger,
  });
  messenger.delegate({
    messenger: controllerInitMessenger,
    actions: ['AuthenticationController:getBearerToken'],
    events: ['AuthenticationController:stateChange'],
  });
  return controllerInitMessenger;
}
