import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'
import { compose } from 'recompose'
import TransactionViewBalance from './transaction-view-balance.component'
import {
  getSelectedToken,
  getSelectedAddress,
  getNativeCurrency,
  getSelectedTokenAssetImage,
  getMetaMaskAccounts,
  isBalanceCached,
  preferencesSelector,
  getIsMainnet,
} from '../../../selectors/selectors'
import { showModal } from '../../../store/actions'

const mapStateToProps = state => {
  const { showFiatInTestnets } = preferencesSelector(state)
  const isMainnet = getIsMainnet(state)
  const selectedAddress = getSelectedAddress(state)
  const { metamask: { network } } = state
  const accounts = getMetaMaskAccounts(state)
  const account = accounts[selectedAddress]
  const { balance } = account

  return {
    selectedToken: getSelectedToken(state),
    network,
    balance,
    nativeCurrency: getNativeCurrency(state),
    assetImage: getSelectedTokenAssetImage(state),
    balanceIsCached: isBalanceCached(state),
    showFiat: (isMainnet || !!showFiatInTestnets),
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
