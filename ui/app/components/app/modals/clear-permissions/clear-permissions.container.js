import { connect } from 'react-redux'
import { compose } from 'recompose'
import withModalProps from '../../../../helpers/higher-order-components/with-modal-props'
import ClearPermissionsComponent from './clear-permissions.component'
import { clearPermissions } from '../../../../store/actions'

const mapDispatchToProps = dispatch => {
  return {
    clearPermissions: () => dispatch(clearPermissions()),
  }
}

export default compose(
  withModalProps,
  connect(null, mapDispatchToProps)
)(ClearPermissionsComponent)
