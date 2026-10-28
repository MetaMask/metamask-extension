import { defineAllowedRouteCapabilities } from '../../helpers/route-messenger-helpers';
import type { RouteMessengerFromCapabilities } from '../../messengers/route-messenger';

export const ONBOARDING_TRACE_ROUTE_CAPABILITIES =
  defineAllowedRouteCapabilities({
    actions: [
      'OnboardingController:startOnboardingJourney',
      'OnboardingController:updateOnboardingJourney',
      'OnboardingController:endOnboardingJourney',
    ],
    events: [],
  });

export type OnboardingTraceRouteMessenger = RouteMessengerFromCapabilities<
  typeof ONBOARDING_TRACE_ROUTE_CAPABILITIES
>;

export const ONBOARDING_ROUTE_CAPABILITIES = defineAllowedRouteCapabilities({
  actions: [
    ...ONBOARDING_TRACE_ROUTE_CAPABILITIES.actions,
    'AppStateController:setContinuityIdForTab',
  ],
  events: [],
});

export type OnboardingMessenger = RouteMessengerFromCapabilities<
  typeof ONBOARDING_ROUTE_CAPABILITIES
>;
