//========
// This file defines a helper which guarantees that when an engineer is
// denylisting capabilities for a controller or service, they don't pass
// something invalid.
//========

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
  // We're just using the types here (although this should probably be in shared/)
  // eslint-disable-next-line import/no-restricted-paths
} from '../../../app/scripts/lib/messenger';
import { ValidateElements } from '../../helpers/validate-elements';

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

export function defineExcludedCapabilities<
  const ActionTypes extends readonly string[],
  const EventTypes extends readonly string[],
>(capabilities: {
  actions: ValidateElements<ActionTypes, RootMessengerActions['type']>;
  events: ValidateElements<EventTypes, RootMessengerEvents['type']>;
}): { actions: ActionTypes; events: EventTypes } {
  return capabilities as { actions: ActionTypes; events: EventTypes };
}
