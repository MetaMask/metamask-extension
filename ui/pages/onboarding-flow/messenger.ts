import type { RouteMessenger } from '../../messengers/route-messenger';
import { defineAllowedRouteCapabilities } from '../../helpers/route-messenger-helpers';

export const ONBOARDING_ROUTE_CAPABILITIES = defineAllowedRouteCapabilities({
  actions: ['AppStateController:setContinuityIdForTab'],
  events: [],
});

export type OnboardingMessenger = RouteMessenger<
  (typeof ONBOARDING_ROUTE_CAPABILITIES.actions)[number],
  never
>;
