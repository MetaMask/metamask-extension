import { FirstTimeFlowType } from '../../shared/constants/onboarding';
import {
  DEFAULT_ROUTE,
  ONBOARDING_COMPLETION_ROUTE,
  ONBOARDING_CREATE_PASSWORD_ROUTE,
  ONBOARDING_IMPORT_WITH_SRP_ROUTE,
  ONBOARDING_METAMETRICS,
  ONBOARDING_SECURE_YOUR_WALLET_ROUTE,
} from '../helpers/constants/routes';

/**
 * When the user unlocks the wallet but onboarding has not fully completed we
 * must direct the user to the appropriate step in the onboarding process.
 *
 * @param {object} state - MetaMask state tree
 * @returns {string} Route to redirect the user to
 */
export function getFirstTimeFlowTypeRouteAfterUnlock(state) {
  const { firstTimeFlowType } = state.metamask;

  if (firstTimeFlowType === FirstTimeFlowType.create) {
    return ONBOARDING_CREATE_PASSWORD_ROUTE;
  } else if (firstTimeFlowType === FirstTimeFlowType.import) {
    return ONBOARDING_IMPORT_WITH_SRP_ROUTE;
  } else if (firstTimeFlowType === FirstTimeFlowType.restore) {
    return ONBOARDING_METAMETRICS;
  }
  return DEFAULT_ROUTE;
}

/**
 * The onboarding flow first asks the user what process they wish to use to
 * initialize their wallet (either create, import, or restore). After that it
 * asks the user to opt into MetaMetrics. This function returns the route the
 * user should be directed to after they opt in or out of MetaMetrics. Note
 * that this differs from getFirstTimeFlowTypeRouteAfterUnlock only for the
 * restore option because the restore option is atypical from the other two
 * options and removes an entire screen from the onboarding flow.
 *
 * @param {object} state - MetaMask state tree
 * @returns {string} Route to redirect the user to
 */
export function getFirstTimeFlowTypeRouteAfterMetaMetricsOptIn(state) {
  const { firstTimeFlowType } = state.metamask;

  if (firstTimeFlowType === FirstTimeFlowType.create) {
    return ONBOARDING_COMPLETION_ROUTE;
  } else if (firstTimeFlowType === FirstTimeFlowType.import) {
    return ONBOARDING_COMPLETION_ROUTE;
  } else if (firstTimeFlowType === FirstTimeFlowType.restore) {
    return ONBOARDING_SECURE_YOUR_WALLET_ROUTE;
  }
  return DEFAULT_ROUTE;
}

export const getFirstTimeFlowType = (state) => {
  return state.metamask.firstTimeFlowType;
};

export const getOnboardingInitiator = (state) => {
  const { onboardingTabs } = state.metamask;

  if (!onboardingTabs || Object.keys(onboardingTabs).length !== 1) {
    return null;
  }

  const location = Object.keys(onboardingTabs)[0];
  const tabId = onboardingTabs[location];
  return {
    location,
    tabId,
  };
};
