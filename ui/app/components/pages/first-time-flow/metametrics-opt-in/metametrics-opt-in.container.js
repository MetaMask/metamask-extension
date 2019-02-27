import { connect } from 'react-redux'
import MetaMetricsOptIn from './metametrics-opt-in.component'
import { setParticipateInMetaMetrics } from '../../../../actions'
import {
  INITIALIZE_CREATE_PASSWORD_ROUTE,
  INITIALIZE_IMPORT_WITH_SEED_PHRASE_ROUTE,
  DEFAULT_ROUTE,
} from '../../../../routes'

const firstTimeFlowTypeNameMap = {
  create: 'Selected Create New Wallet',
  'import': 'Selected Import Wallet',
}

const mapStateToProps = ({ metamask }) => {
  const { firstTimeFlowType } = metamask

  let nextRoute
  if (firstTimeFlowType === 'create') {
    nextRoute = INITIALIZE_CREATE_PASSWORD_ROUTE
  } else if (firstTimeFlowType === 'import') {
    nextRoute = INITIALIZE_IMPORT_WITH_SEED_PHRASE_ROUTE
  } else {
    nextRoute = DEFAULT_ROUTE
  }

  return {
    nextRoute,
    firstTimeSelectionMetaMetricsName: firstTimeFlowTypeNameMap[firstTimeFlowType],
  }
}

const mapDispatchToProps = dispatch => {
  return {
    setParticipateInMetaMetrics: (val) => dispatch(setParticipateInMetaMetrics(val)),
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(MetaMetricsOptIn)
