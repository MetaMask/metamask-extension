//========
// All actions and events for the RewardsController that we want to expose to
// the UI would live here. The idea is that the team responsible for this
// service would maintain these types (the Rewards team in this case).
//========

import { MessengerActions, MessengerEvents } from '@metamask/messenger';
import { RewardsControllerMessenger } from '../../app/scripts/controller-init/messengers/rewards-controller-messenger';

// Update this list to change the set of actions available in the UI.
export const UI_ACTIONS = [
  'RewardsController:getSeasonMetadata',
  'RewardsController:getSeasonStatus',
] as const;

// Update this list to change the set of events available in the UI.
export const UI_EVENTS = [] as const;

export type UIActions = Extract<
  MessengerActions<RewardsControllerMessenger>,
  { type: (typeof UI_ACTIONS)[number] }
>;

export type UIEvents = Extract<
  MessengerEvents<RewardsControllerMessenger>,
  { type: (typeof UI_EVENTS)[number] }
>;
