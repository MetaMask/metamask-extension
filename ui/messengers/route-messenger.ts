//========
// This file defines the type for route messengers.
//========

import type {
  Messenger,
  ActionConstraint,
  EventConstraint,
} from '@metamask/messenger';
import type {
  UIMessenger,
  UIMessengerActions,
  UIMessengerEvents,
} from './ui-messenger';

/**
 * Namespace for route messengers.
 *
 * All route messengers share this namespace since only one route is active at a
 * time. (This is purely decorative because we don't plan on registering actions
 * directly on routes anyway.)
 */
export const ROUTE_MESSENGER_NAMESPACE = 'Route';

/**
 * A messenger that represents a route.
 *
 * This type is intentionally generic (a bit unusual for messenger "instance"
 * types) because each route gets its own messenger (the "route messenger" isn't
 * a singleton as is the case for controllers and services).
 */
export type RouteMessenger<
  Actions extends ActionConstraint = UIMessengerActions,
  Events extends EventConstraint = UIMessengerEvents,
> = Messenger<typeof ROUTE_MESSENGER_NAMESPACE, Actions, Events, UIMessenger>;
