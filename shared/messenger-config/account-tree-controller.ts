//========
// All actions and events for the AccountTreeController that we want to expose to
// the UI would live here. The idea is that the team responsible for this
// service would maintain these types (the Rewards team in this case).
//========

import { AccountTreeControllerMessenger } from '@metamask/account-tree-controller';
import { ExtractMessengerActions, ExtractMessengerEvents } from './helpers';

// Update this list to change the set of actions available in the UI.
export const UI_ACTIONS = [] as const;

// Update this list to change the set of events available in the UI.
export const UI_EVENTS = [
  'AccountTreeController:selectedAccountGroupChange',
] as const;

export type UIActions = ExtractMessengerActions<
  AccountTreeControllerMessenger,
  typeof UI_ACTIONS
>;

export type UIEvents = ExtractMessengerEvents<
  AccountTreeControllerMessenger,
  typeof UI_EVENTS
>;
