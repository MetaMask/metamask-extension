//========
// All actions and events for the KeyringController that we want to expose to
// the UI would live here. The idea is that the team responsible for this
// service would maintain these types (the Core Platform team in this case).
//========

import { KeyringControllerMessenger } from '@metamask/keyring-controller';
import { ExtractMessengerActions, ExtractMessengerEvents } from './helpers';

// Update this list to change the set of actions available in the UI.
export const UI_ACTIONS = [] as const;

// Update this list to change the set of events available in the UI.
export const UI_EVENTS = ['KeyringController:unlock'] as const;

export type UIActions = ExtractMessengerActions<
  KeyringControllerMessenger,
  typeof UI_ACTIONS
>;

export type UIEvents = ExtractMessengerEvents<
  KeyringControllerMessenger,
  typeof UI_EVENTS
>;
