//========
// All actions and events for the BridgeController that we want to expose to
// the UI would live here. The idea is that the team responsible for this
// service would maintain these types (the Rewards team in this case).
//========

import { BridgeControllerMessenger } from '@metamask/bridge-controller';
import { ExtractMessengerActions, ExtractMessengerEvents } from './helpers';

// Update this list to change the set of actions available in the UI.
export const UI_ACTIONS = [
  'BridgeController:updateBridgeQuoteRequestParams',
] as const;

// Update this list to change the set of events available in the UI.
export const UI_EVENTS = [] as const;

export type UIActions = ExtractMessengerActions<
  BridgeControllerMessenger,
  typeof UI_ACTIONS
>;

export type UIEvents = ExtractMessengerEvents<
  BridgeControllerMessenger,
  typeof UI_EVENTS
>;
