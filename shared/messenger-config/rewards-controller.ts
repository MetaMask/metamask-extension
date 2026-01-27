//========
// All actions and events for the RewardsController that we want to expose to
// the UI would live here. The idea is that the team responsible for this
// service would maintain these types (the Rewards team in this case).
//========

// We are just grabbing the type.
// eslint-disable-next-line import/no-restricted-paths
import { RewardsControllerMessenger } from '../../app/scripts/controller-init/messengers/rewards-controller-messenger';
import { ExtractMessengerActions, ExtractMessengerEvents } from './helpers';

// Update this list to change the set of actions available in the UI.
export const UI_ACTIONS = [
  'RewardsController:getSeasonMetadata',
  'RewardsController:getSeasonStatus',
] as const;

// Update this list to change the set of events available in the UI.
export const UI_EVENTS = [] as const;

export type UIActions = ExtractMessengerActions<
  RewardsControllerMessenger,
  typeof UI_ACTIONS
>;

export type UIEvents = ExtractMessengerEvents<
  RewardsControllerMessenger,
  typeof UI_EVENTS
>;
