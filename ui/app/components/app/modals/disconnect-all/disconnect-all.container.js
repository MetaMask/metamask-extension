import { connect } from 'react-redux'
import { compose } from 'recompose'
import { withRouter } from 'react-router-dom'
import withModalProps from '../../../../helpers/higher-order-components/with-modal-props'
import DisconnectAll from './disconnect-all.component'
import { clearPermissions } from '../../../../store/actions'

const mapDispatchToProps = (dispatch) => {
  return {
    disconnectAll: () => {
      dispatch(clearPermissions())
    },
  }
}

export default compose(
  withModalProps,
  withRouter,
  connect(null, mapDispatchToProps)
)(DisconnectAll)
