import { connect } from 'react-redux'
import { compose } from 'recompose'
import MetaMetricsOptIn from './metametrics-opt-in.component'
import withModalProps from '../../../higher-order-components/with-modal-props'
import { setParticipateInMetaMetrics } from '../../../actions'

const mapStateToProps = (state, ownProps) => {
  const { unapprovedTxCount } = ownProps

  return {
    unapprovedTxCount,
  }
}

const mapDispatchToProps = dispatch => {
  return {
    setParticipateInMetaMetrics: (val) => dispatch(setParticipateInMetaMetrics(val)),
  }
}

export default compose(
  withModalProps,
  connect(mapStateToProps, mapDispatchToProps),
)(MetaMetricsOptIn)
