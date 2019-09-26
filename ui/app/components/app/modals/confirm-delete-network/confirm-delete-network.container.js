import { connect } from 'react-redux'
import { compose } from 'recompose'
import withModalProps from '../../../../helpers/higher-order-components/with-modal-props'
import ConfirmDeleteNetwork from './confirm-delete-network.component'
import { delRpcTarget } from '../../../../store/actions'

const mapDispatchToProps = dispatch => {
  return {
    delRpcTarget: (target) => dispatch(delRpcTarget(target)),
  }
}

export default compose(
  withModalProps,
  connect(null, mapDispatchToProps)
)(ConfirmDeleteNetwork)
