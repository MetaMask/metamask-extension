//========
// All actions and events for the NetworkController that we want to expose to
// the UI would live here. The idea is that the team responsible for this
// service would maintain these types (the Core Platform team in this case).
//========

import { NetworkControllerMessenger } from '@metamask/network-controller';
import { ExtractMessengerActions, ExtractMessengerEvents } from './helpers';

// Update this list to change the set of actions available in the UI.
export const UI_ACTIONS = ['NetworkController:addNetwork'] as const;

// Update this list to change the set of events available in the UI.
export const UI_EVENTS = [] as const;

export type UIActions = ExtractMessengerActions<
  NetworkControllerMessenger,
  typeof UI_ACTIONS
>;

export type UIEvents = ExtractMessengerEvents<
  NetworkControllerMessenger,
  typeof UI_EVENTS
>;
