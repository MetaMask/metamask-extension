//========
// All actions and events for the KeyringController that we want to expose to
// the UI would live here. The idea is that the team responsible for this
// service would maintain these types (the Core Platform team in this case).
//========

import { MessengerActions, MessengerEvents } from '@metamask/messenger';
import { KeyringControllerMessenger } from '@metamask/keyring-controller';

// Update this list to change the set of actions available in the UI.
export const UI_ACTIONS = ['KeyringController:unlock'] as const;

// Update this list to change the set of events available in the UI.
export const UI_EVENTS = [] as const;

export type UIActions = Extract<
  MessengerActions<KeyringControllerMessenger>,
  { type: (typeof UI_ACTIONS)[number] }
>;

export type UIEvents = Extract<
  MessengerEvents<KeyringControllerMessenger>,
  { type: (typeof UI_EVENTS)[number] }
>;
