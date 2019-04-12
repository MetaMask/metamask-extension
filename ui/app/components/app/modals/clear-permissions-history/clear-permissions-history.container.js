import { connect } from 'react-redux'
import { compose } from 'recompose'
import withModalProps from '../../../../helpers/higher-order-components/with-modal-props'
import ClearPermissionsHistoryComponent from './clear-permissions-history.component'
import { clearPermissionsHistory } from '../../../../store/actions'

const mapDispatchToProps = dispatch => {
  return {
    clearPermissionsHistory: () => dispatch(clearPermissionsHistory()),
  }
}

export default compose(
  withModalProps,
  connect(null, mapDispatchToProps)
)(ClearPermissionsHistoryComponent)
