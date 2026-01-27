//========
// All actions and events for the WalletService that we want to expose to the UI
// would live here. The idea is that the team responsible for this service would
// maintain these types (the Extension Platform team in this case).
//========

// We are just grabbing the type.
// eslint-disable-next-line import/no-restricted-paths
import { WalletServiceMessenger } from '../../app/scripts/services/wallet-service';
import { ExtractMessengerActions, ExtractMessengerEvents } from './helpers';

// Update this list to change the set of actions available in the UI.
export const UI_ACTIONS = [
  'WalletService:addNewAccount',
  'WalletService:getCode',
] as const;

// Update this list to change the set of events available in the UI.
export const UI_EVENTS = [] as const;

export type UIActions = ExtractMessengerActions<
  WalletServiceMessenger,
  typeof UI_ACTIONS
>;

export type UIEvents = ExtractMessengerEvents<
  WalletServiceMessenger,
  typeof UI_EVENTS
>;
