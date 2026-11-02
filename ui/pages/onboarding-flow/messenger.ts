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
