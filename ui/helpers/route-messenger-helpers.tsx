import React from 'react';
import { RouteObject } from 'react-router-dom';
import {
  UIMessengerActions,
  UIMessengerEvents,
} from '../messengers/ui-messenger';
import { RouteWithMessenger } from '../layouts/route-with-messenger';

/**
 * Validate that each element of a tuple is a member of the given union,
 * producing a type error for elements that aren't.
 */
export type ValidateElements<
  Elements extends readonly string[],
  AllowedElements extends string,
> = {
  [K in keyof Elements]: Elements[K] extends AllowedElements
    ? Elements[K]
    : AllowedElements;
};

/**
 * Helper function to define the allowed capabilities for a route messenger.
 * This is primarily a type-level helper to ensure that the allowed capabilities
 * are valid UI messenger capabilities and to get better type inference for the
 * allowed capabilities.
 *
 * @param capabilities - The capabilities to allow, which must be valid action
 * and event types for the `UIMessenger`.
 * @param capabilities.actions - The action types to allow, which must be
 * valid action types for the `UIMessenger`.
 * @param capabilities.events - The event types to allow, which must be valid
 * event types for the `UIMessenger`.
 * @returns The given capabilities, typed as the specific action and event types
 * that were allowed.
 */
export function defineAllowedRouteCapabilities<
  const ActionTypes extends string[],
  const EventTypes extends string[],
>(capabilities: {
  actions: ValidateElements<ActionTypes, UIMessengerActions['type']>;
  events: ValidateElements<EventTypes, UIMessengerEvents['type']>;
}): { actions: ActionTypes; events: EventTypes } {
  return capabilities as { actions: ActionTypes; events: EventTypes };
}

type RouteWithMessengerOptions = {
  path: string;
  element: React.ReactNode;
  capabilities: {
    actions?: UIMessengerActions['type'][];
    events?: UIMessengerEvents['type'][];
  };
};

/**
 * Create a route object with a {@link RouteWithMessenger} element that provides
 * a route messenger with the specified capabilities.
 *
 * @param options - Options bag.
 * @param options.path - The path of the route. This is used for debugging
 * purposes and to ensure that the route messenger's namespace is unique across
 * routes.
 * @param options.element - The element to render for this route. This will be
 * wrapped in a {@link RouteWithMessenger} component that provides the route
 * messenger.
 * @param options.capabilities - Capabilities to delegate from the UI messenger
 * to the route messenger.
 */
export function createRouteWithMessenger({
  path,
  element,
  capabilities,
}: RouteWithMessengerOptions): RouteObject {
  return {
    path,
    element: (
      <RouteWithMessenger path={path} capabilities={capabilities}>
        {element}
      </RouteWithMessenger>
    ),
  };
}
