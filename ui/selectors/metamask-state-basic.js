/**
 * Minimal metamask state selectors with no dependency on store/actions or ducks/metamask.
 * Used to break the metamask.js ↔ actions.ts circular dependency.
 */
import { AlertTypes } from '../../shared/constants/alerts';

export const getAlertEnabledness = (state) => state.metamask.alertEnabledness;

export const getUnconnectedAccountAlertEnabledness = (state) =>
  getAlertEnabledness(state)[AlertTypes.unconnectedAccount];

export function getCompletedOnboarding(state) {
  return state.metamask.completedOnboarding;
}
