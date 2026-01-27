//========
// All actions and events for the AccountTreeController that we want to expose to
// the UI would live here. The idea is that the team responsible for this
// service would maintain these types (the Rewards team in this case).
//========

import { MessengerActions, MessengerEvents } from '@metamask/messenger';
import { AccountTreeControllerMessenger } from '@metamask/account-tree-controller';

// Update this list to change the set of actions available in the UI.
export const UI_ACTIONS = [] as const;

// Update this list to change the set of events available in the UI.
export const UI_EVENTS = [
  'AccountTreeController:selectedAccountGroupChange',
] as const;

export type UIActions = Extract<
  MessengerActions<AccountTreeControllerMessenger>,
  { type: (typeof UI_ACTIONS)[number] }
>;

export type UIEvents = Extract<
  MessengerEvents<AccountTreeControllerMessenger>,
  { type: (typeof UI_EVENTS)[number] }
>;
