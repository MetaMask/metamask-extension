import {
  INITIALIZE_CREATE_PASSWORD_ROUTE,
  INITIALIZE_IMPORT_WITH_SEED_PHRASE_ROUTE,
  DEFAULT_ROUTE,
} from '../../helpers/constants/routes'

function getFirstTimeFlowTypeRoute (state) {
  const { firstTimeFlowType } = state.metamask

  let nextRoute
  if (firstTimeFlowType === 'create') {
    nextRoute = INITIALIZE_CREATE_PASSWORD_ROUTE
  } else if (firstTimeFlowType === 'import') {
    nextRoute = INITIALIZE_IMPORT_WITH_SEED_PHRASE_ROUTE
  } else {
    nextRoute = DEFAULT_ROUTE
  }

  return nextRoute
}

const getOnboardingInitiator = (state) => {
  const { initiatedOnboarding, onboardingTabs } = state.metamask

  if (!initiatedOnboarding || initiatedOnboarding.length !== 1 || !onboardingTabs) {
    return null
  }

  const origin = initiatedOnboarding[0]
  if (!onboardingTabs[origin]) {
    return null
  }

  const tabId = onboardingTabs[origin]
  return {
    origin,
    tabId,
  }
}

const selectors = {
  getFirstTimeFlowTypeRoute,
  getOnboardingInitiator,
}

module.exports = selectors
