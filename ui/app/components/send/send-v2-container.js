const connect = require('react-redux').connect
const actions = require('../../actions')
const abi = require('ethereumjs-abi')
const SendEther = require('../../send-v2')

const { multiplyCurrencies } = require('../../conversion-util')

const {
  accountsWithSendEtherInfoSelector,
  getCurrentAccountWithSendEtherInfo,
  conversionRateSelector,
  getSelectedToken,
  getSelectedTokenExchangeRate,
  getSelectedAddress,
  getGasPrice,
  getGasLimit,
} = require('../../selectors')

module.exports = connect(mapStateToProps, mapDispatchToProps)(SendEther)

function mapStateToProps (state) {
  const selectedAddress = getSelectedAddress(state);
  const selectedToken = getSelectedToken(state);
  const tokenExchangeRates = state.metamask.tokenExchangeRates
  const selectedTokenExchangeRate = getSelectedTokenExchangeRate(state)
  const conversionRate = conversionRateSelector(state)

  let data;
  let primaryCurrency;
  let tokenToUSDRate;
  if (selectedToken) {
    data = Array.prototype.map.call(
      abi.rawEncode(['address', 'uint256'], [selectedAddress, '0x0']),
      x => ('00' + x.toString(16)).slice(-2)
    ).join('')

    primaryCurrency = selectedToken.symbol

    tokenToUSDRate = multiplyCurrencies(
      conversionRate,
      selectedTokenExchangeRate,
      { toNumericBase: 'dec' }
    )
  }

  return {
    selectedAccount: getCurrentAccountWithSendEtherInfo(state),
    accounts: accountsWithSendEtherInfoSelector(state),
    conversionRate,
    selectedToken,
    primaryCurrency,
    data,
    tokenToUSDRate,
    gasPrice: getGasPrice(state),
    gasLimit: getGasLimit(state),
  }
}

function mapDispatchToProps (dispatch) {
  return {
    showCustomizeGasModal: () => dispatch(actions.showModal({ name: 'CUSTOMIZE_GAS' })),
    estimateGas: params => dispatch(actions.estimateGas(params)),
    getGasPrice: () => dispatch(actions.getGasPrice()),
    updateTokenExchangeRate: token => dispatch(actions.updateTokenExchangeRate(token)),
  }
}
