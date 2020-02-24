import {
  INITIALIZE_CREATE_PASSWORD_ROUTE,
  INITIALIZE_IMPORT_WITH_SEED_PHRASE_ROUTE,
  DEFAULT_ROUTE,
} from '../../helpers/constants/routes'

<<<<<<< HEAD
const selectors = {
  getFirstTimeFlowTypeRoute,
}

module.exports = selectors

function getFirstTimeFlowTypeRoute (state) {
=======
export function getFirstTimeFlowTypeRoute (state) {
>>>>>>> eebc504b0f23d7c7b725e111a89665a2ac7d50dc
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
<<<<<<< HEAD
=======

export const getOnboardingInitiator = (state) => {
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
>>>>>>> eebc504b0f23d7c7b725e111a89665a2ac7d50dc
