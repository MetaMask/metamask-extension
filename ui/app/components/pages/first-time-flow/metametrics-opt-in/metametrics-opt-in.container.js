import { connect } from 'react-redux'
import MetaMetricsOptIn from './metametrics-opt-in.component'
import { setParticipateInMetaMetrics } from '../../../../actions'

const mapStateToProps = state => {
  const { metamask: { selectedAddress } } = state

  return {
    selectedAddress,
  }
}

const mapDispatchToProps = dispatch => {
  return {
    setParticipateInMetaMetrics: (val) => dispatch(setParticipateInMetaMetrics(val)),
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(MetaMetricsOptIn)
