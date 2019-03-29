import { connect } from 'react-redux'
import { compose } from 'recompose'
import ConfirmRemoveAccount from './confirm-remove-account.component'
import withModalProps from '../../../../helpers/higher-order-components/with-modal-props'
import { removeAccount } from '../../../../store/actions'

const mapStateToProps = state => {
  return {
    network: state.metamask.network,
  }
}

const mapDispatchToProps = dispatch => {
  return {
    removeAccount: (address) => dispatch(removeAccount(address)),
  }
}

export default compose(
  withModalProps,
  connect(mapStateToProps, mapDispatchToProps)
)(ConfirmRemoveAccount)
