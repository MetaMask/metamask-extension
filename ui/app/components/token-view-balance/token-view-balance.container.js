import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'
import { compose } from 'recompose'
import TokenViewBalance from './token-view-balance.component'
import { getSelectedToken, getSelectedAddress } from '../../selectors'
import { showModal } from '../../actions'
import { getValueFromWeiHex } from '../../helpers/confirm-transaction/util'

const mapStateToProps = state => {
  const selectedAddress = getSelectedAddress(state)
  const { metamask } = state
  const { network, accounts, currentCurrency, conversionRate } = metamask
  const account = accounts[selectedAddress]
  const { balance: value } = account

  const ethBalance = getValueFromWeiHex({
    value, toCurrency: 'ETH', conversionRate, numberOfDecimals: 3,
  })

  const fiatBalance = getValueFromWeiHex({
    value, toCurrency: currentCurrency, conversionRate, numberOfDecimals: 2,
  })

  return {
    selectedToken: getSelectedToken(state),
    network,
    ethBalance,
    fiatBalance,
    currentCurrency,
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
)(TokenViewBalance)
