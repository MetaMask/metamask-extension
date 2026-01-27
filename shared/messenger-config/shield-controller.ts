//========
// All actions and events for the ShieldController that we want to expose to the
// UI would live here. The idea is that the team responsible for this service
// would maintain these types (the Web3Auth team in this case).
//========

import { ShieldControllerMessenger } from '@metamask/shield-controller';
import { ExtractMessengerActions, ExtractMessengerEvents } from './helpers';

// Update this list to change the set of actions available in the UI.
export const UI_ACTIONS = ['ShieldController:checkCoverage'] as const;

// Update this list to change the set of events available in the UI.
export const UI_EVENTS = [] as const;

export type UIActions = ExtractMessengerActions<
  ShieldControllerMessenger,
  typeof UI_ACTIONS
>;

export type UIEvents = ExtractMessengerEvents<
  ShieldControllerMessenger,
  typeof UI_EVENTS
>;
