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
  getAddressBook,
  getSendFrom,
} = require('../../selectors')

module.exports = connect(mapStateToProps, mapDispatchToProps)(SendEther)

function mapStateToProps (state) {
  const fromAccounts = accountsWithSendEtherInfoSelector(state)
  const selectedAddress = getSelectedAddress(state)
  const selectedToken = getSelectedToken(state)
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
    ...state.metamask.send,
    from: getSendFrom(state) || getCurrentAccountWithSendEtherInfo(state),
    fromAccounts,
    toAccounts: [...fromAccounts, ...getAddressBook(state)],
    conversionRate,
    selectedToken,
    primaryCurrency,
    data,
    amountConversionRate: selectedToken ? tokenToUSDRate : conversionRate,
  }
}

function mapDispatchToProps (dispatch) {
  return {
    showCustomizeGasModal: () => dispatch(actions.showModal({ name: 'CUSTOMIZE_GAS' })),
    estimateGas: params => dispatch(actions.estimateGas(params)),
    getGasPrice: () => dispatch(actions.getGasPrice()),
    updateTokenExchangeRate: token => dispatch(actions.updateTokenExchangeRate(token)),
    signTokenTx: (tokenAddress, toAddress, amount, txData) => (
      dispatch(actions.signTokenTx(tokenAddress, toAddress, amount, txData))
    ),
    signTx: txParams => dispatch(actions.signTx(txParams)),
    setSelectedAddress: address => dispatch(actions.setSelectedAddress(address)),
    addToAddressBook: address => dispatch(actions.addToAddressBook(address)),
    updateGasTotal: newTotal => dispatch(actions.updateGasTotal(newTotal)),
    updateSendFrom: newFrom => dispatch(actions.updateSendFrom(newFrom)),
    updateSendTo: newTo => dispatch(actions.updateSendTo(newTo)),
    updateSendAmount: newAmount => dispatch(actions.updateSendAmount(newAmount)),
    updateSendMemo: newMemo => dispatch(actions.updateSendMemo(newMemo)),
  }
}
