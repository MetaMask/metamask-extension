//========
// All actions and events for the ShieldController that we want to expose to the
// UI would live here. The idea is that the team responsible for this service
// would maintain these types (the Web3Auth team in this case).
//========

import { MessengerActions, MessengerEvents } from '@metamask/messenger';
import { ShieldControllerMessenger } from '@metamask/shield-controller';

// Update this list to change the set of actions available in the UI.
export const UI_ACTIONS = ['ShieldController:checkCoverage'] as const;

// Update this list to change the set of events available in the UI.
export const UI_EVENTS = [] as const;

export type UIActions = Extract<
  MessengerActions<ShieldControllerMessenger>,
  { type: (typeof UI_ACTIONS)[number] }
>;

export type UIEvents = Extract<
  MessengerEvents<ShieldControllerMessenger>,
  { type: (typeof UI_EVENTS)[number] }
>;
