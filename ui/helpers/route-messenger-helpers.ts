//========
// This file defines a helper which guarantees that when an engineer is
// allowlisting capabilities for a route, they don't pass something invalid.
//========

import {
  UIMessengerActions,
  UIMessengerEvents,
} from '../messengers/ui-messenger';
import { ValidateElements } from './validate-elements';

export function defineAllowedRouteCapabilities<
  const ActionTypes extends string[],
  const EventTypes extends string[],
>(capabilities: {
  actions: ValidateElements<ActionTypes, UIMessengerActions['type']>;
  events: ValidateElements<EventTypes, UIMessengerEvents['type']>;
}): { actions: ActionTypes; events: EventTypes } {
  return capabilities as { actions: ActionTypes; events: EventTypes };
}
