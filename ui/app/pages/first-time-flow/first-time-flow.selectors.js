import {
  INITIALIZE_CREATE_PASSWORD_ROUTE,
  INITIALIZE_IMPORT_WITH_SEED_PHRASE_ROUTE,
  DEFAULT_ROUTE,
} from '../../helpers/constants/routes'

const selectors = {
  getFirstTimeFlowTypeRoute,
}

module.exports = selectors

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
