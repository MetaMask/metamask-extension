import { connect } from 'react-redux'
import MetaMetricsOptIn from './metametrics-opt-in.component'
import { setParticipateInMetaMetrics } from '../../../../actions'

const mapDispatchToProps = dispatch => {
  return {
    setParticipateInMetaMetrics: (val) => dispatch(setParticipateInMetaMetrics(val)),
  }
}

export default connect(null, mapDispatchToProps)(MetaMetricsOptIn)
