import {
  ActionConstraint,
  EventConstraint,
  Messenger,
  MessengerActions,
  MessengerEvents,
} from '@metamask/messenger';
import type {
  RootMessengerActions,
  RootMessengerEvents,
  // We're just using the types here (although this should probably be in `shared/`)
  // eslint-disable-next-line import-x/no-restricted-paths
} from '../../../app/scripts/lib/messenger';
import type { ValidateElements } from '../../helpers/route-messenger-helpers';

export type ExtractMessengerActionsExcluding<
  MessengerInstance extends Messenger<
    string,
    ActionConstraint,
    EventConstraint
  >,
  ActionTypes extends readonly MessengerActions<MessengerInstance>['type'][],
> = Exclude<MessengerActions<MessengerInstance>, { type: ActionTypes[number] }>;

export type ExtractMessengerEventsExcluding<
  MessengerInstance extends Messenger<
    string,
    ActionConstraint,
    EventConstraint
  >,
  EventTypes extends readonly MessengerEvents<MessengerInstance>['type'][],
> = Exclude<MessengerEvents<MessengerInstance>, { type: EventTypes[number] }>;

/**
 * Helper function to define the excluded capabilities for a messenger. This is
 * primarily a type-level helper to ensure that the excluded capabilities are
 * valid and to get better type inference for the excluded capabilities.
 *
 * @param capabilities - The capabilities to exclude, which must be valid action
 * and event types for the `RootMessenger`.
 * @param capabilities.actions - The action types to exclude, which must be
 * valid action types for the `RootMessenger`.
 * @param capabilities.events - The event types to exclude, which must be valid
 * event types for the `RootMessenger`.
 * @returns The given capabilities, typed as the specific action and event types
 * that were excluded.
 */
export function defineExcludedCapabilities<
  const ActionTypes extends readonly string[],
  const EventTypes extends readonly string[],
>(capabilities: {
  actions: ValidateElements<ActionTypes, RootMessengerActions['type']>;
  events: ValidateElements<EventTypes, RootMessengerEvents['type']>;
}): { actions: ActionTypes; events: EventTypes } {
  return capabilities as { actions: ActionTypes; events: EventTypes };
}
