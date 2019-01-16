import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'
import { compose } from 'recompose'
import TransactionViewBalance from './transaction-view-balance.component'
import {
  getSelectedToken,
  getSelectedAddress,
  getSelectedTokenAssetImage,
  getMetaMaskAccounts,
} from '../../selectors'
import { showModal } from '../../actions'

const mapStateToProps = state => {
  const selectedAddress = getSelectedAddress(state)
  const { metamask: { network } } = state
  const accounts = getMetaMaskAccounts(state)
  const account = accounts[selectedAddress]
  const { balance } = account

  return {
    selectedToken: getSelectedToken(state),
    network,
    balance,
    assetImage: getSelectedTokenAssetImage(state),
  }
}

const mapDispatchToProps = dispatch => {
  return {
    showDepositModal: () => dispatch(showModal({ name: 'DEPOSIT_ETHER' })),
  }
}

export default compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps)
)(TransactionViewBalance)
