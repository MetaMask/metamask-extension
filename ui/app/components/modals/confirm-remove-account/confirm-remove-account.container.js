import { connect } from 'react-redux'
import ConfirmRemoveAccount from './confirm-remove-account.component'

const { hideModal, removeAccount } = require('../../../actions')

const mapStateToProps = state => {
  return {
    identity: state.appState.modal.modalState.props.identity,
    network: state.metamask.network,
  }
}

const mapDispatchToProps = dispatch => {
  return {
    hideModal: () => dispatch(hideModal()),
    removeAccount: (address) => dispatch(removeAccount(address)),
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(ConfirmRemoveAccount)
