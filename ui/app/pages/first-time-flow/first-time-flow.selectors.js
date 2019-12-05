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
  const { onboardingTabs } = state.metamask

  if (!onboardingTabs || Object.keys(onboardingTabs).length !== 1) {
    return null
  }

  const location = Object.keys(onboardingTabs)[0]
  const tabId = onboardingTabs[location]
  return {
    location,
    tabId,
  }
}

const selectors = {
  getFirstTimeFlowTypeRoute,
  getOnboardingInitiator,
}

module.exports = selectors
