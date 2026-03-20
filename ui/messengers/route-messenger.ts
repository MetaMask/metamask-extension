/**
 * Route messenger type — per-route scoped messenger.
 *
 * All route messengers share the 'Route' namespace since only one route is
 * active at a time. The type is generic because each route gets its own
 * messenger with a different subset of capabilities.
 *
 * @see {@link https://github.com/MetaMask/metamask-extension/compare/main...messenger-ui-integration-prototype}
 */
import type {
  ActionConstraint,
  EventConstraint,
  Messenger,
} from '@metamask/messenger';
import type {
  UIMessenger,
  UIMessengerActions,
  UIMessengerEvents,
} from './ui-messenger';

export const ROUTE_MESSENGER_NAMESPACE = 'Route';

export type RouteMessenger<
  Actions extends ActionConstraint = UIMessengerActions,
  Events extends EventConstraint = UIMessengerEvents,
> = Messenger<typeof ROUTE_MESSENGER_NAMESPACE, Actions, Events, UIMessenger>;
