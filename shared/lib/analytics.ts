import { isObject } from '@metamask/utils';

/**
 * Checks whether persisted analytics state records explicit consent.
 *
 * @param state - Partial persisted or backup state that may include AnalyticsController.
 * @returns Whether the user opted in after making a consent decision.
 */
export function hasAnalyticsConsent(
  state?: Record<string, unknown> | null,
): boolean {
  const analyticsController = state?.AnalyticsController;
  return (
    isObject(analyticsController) &&
    analyticsController.consentDecisionMade === true &&
    analyticsController.optedIn === true
  );
}
