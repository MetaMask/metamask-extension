//========
// All actions and events for the WalletService that we want to expose to the UI
// would live here. The idea is that the team responsible for this service would
// maintain these types (the Extension Platform team in this case).
//========

import { MessengerActions, MessengerEvents } from '@metamask/messenger';
import { WalletServiceMessenger } from '../../app/scripts/services/wallet-service';

// Update this list to change the set of actions available in the UI.
export const UI_ACTIONS = [
  'WalletService:addNewAccount',
  'WalletService:getCode',
] as const;

// Update this list to change the set of events available in the UI.
export const UI_EVENTS = [] as const;

export type UIActions = Extract<
  MessengerActions<WalletServiceMessenger>,
  { type: (typeof UI_ACTIONS)[number] }
>;

export type UIEvents = Extract<
  MessengerEvents<WalletServiceMessenger>,
  { type: (typeof UI_EVENTS)[number] }
>;
