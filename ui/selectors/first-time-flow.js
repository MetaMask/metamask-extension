import {
  DEFAULT_ROUTE,
  ONBOARDING_CREATE_PASSWORD_ROUTE,
  ONBOARDING_IMPORT_WITH_SRP_ROUTE,
} from '../helpers/constants/routes';

export function getFirstTimeFlowTypeRoute(state) {
  const { firstTimeFlowType } = state.metamask;

  let nextRoute;
  if (firstTimeFlowType === 'create') {
    nextRoute = ONBOARDING_CREATE_PASSWORD_ROUTE;
  } else if (firstTimeFlowType === 'import') {
    nextRoute = ONBOARDING_IMPORT_WITH_SRP_ROUTE;
  } else {
    nextRoute = DEFAULT_ROUTE;
  }

  return nextRoute;
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
