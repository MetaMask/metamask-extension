import { connect } from 'react-redux'
import { compose } from 'recompose'
import ConfirmRemoveAccount from './confirm-remove-account.component'
import withModalProps from '../../../higher-order-components/with-modal-props'

const { hideModal, removeAccount } = require('../../../actions')

const mapStateToProps = state => {
  return {
    network: state.metamask.network,
  }
}

const mapDispatchToProps = dispatch => {
  return {
    hideModal: () => dispatch(hideModal()),
    removeAccount: (address) => dispatch(removeAccount(address)),
  }
}

export default compose(
  withModalProps,
  connect(mapStateToProps, mapDispatchToProps)
)(ConfirmRemoveAccount)
