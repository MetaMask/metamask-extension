import { connect } from 'react-redux'
import { compose } from 'recompose'
import withModalProps from '../../../../helpers/higher-order-components/with-modal-props'
import ClearPermissionsActivityComponent from './clear-permissions-activity.component'
import { clearPermissionsLog } from '../../../../store/actions'

const mapDispatchToProps = dispatch => {
  return {
    clearPermissionsLog: () => dispatch(clearPermissionsLog()),
  }
}

export default compose(
  withModalProps,
  connect(null, mapDispatchToProps)
)(ClearPermissionsActivityComponent)
