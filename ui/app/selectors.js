const valuesFor = require('./util').valuesFor

const selectors = {
  getSelectedAddress,
  getSelectedIdentity,
  getSelectedAccount,
  getSelectedToken,
  getSelectedTokenExchangeRate,
  conversionRateSelector,
  transactionsSelector,
  accountsWithSendEtherInfoSelector,
  getCurrentAccountWithSendEtherInfo,
  getGasPrice,
  getGasLimit,
  getAddressBook,
  getSendFrom,
  getCurrentCurrency,
}

module.exports = selectors

function getSelectedAddress (state) {
  const selectedAddress = state.metamask.selectedAddress || Object.keys(state.metamask.accounts)[0]

  return selectedAddress
}

function getSelectedIdentity (state) {
  const selectedAddress = getSelectedAddress(state)
  const identities = state.metamask.identities

  return identities[selectedAddress]
}

function getSelectedAccount (state) {
  const accounts = state.metamask.accounts
  const selectedAddress = getSelectedAddress(state)

  return accounts[selectedAddress]
}

function getSelectedToken (state) {
  const tokens = state.metamask.tokens || []
  const selectedTokenAddress = state.metamask.selectedTokenAddress
  const selectedToken = tokens.filter(({ address }) => address === selectedTokenAddress)[0]

  return selectedToken || null
}

function getSelectedTokenExchangeRate (state) {
  const tokenExchangeRates = state.metamask.tokenExchangeRates
  const selectedToken = getSelectedToken(state) || {}
  const { symbol = '' } = selectedToken

  const pair = `${symbol.toLowerCase()}_eth`
  const { rate: tokenExchangeRate = 0 } = tokenExchangeRates[pair] || {}

  return tokenExchangeRate
}

function conversionRateSelector (state) {
  return state.metamask.conversionRate
}

function getAddressBook (state) {
  return state.metamask.addressBook
}

function accountsWithSendEtherInfoSelector (state) {
  const {
    accounts,
    identities,
  } = state.metamask

  const accountsWithSendEtherInfo = Object.entries(accounts).map(([key, account]) => {
    return Object.assign({}, account, identities[key])
  })

  return accountsWithSendEtherInfo
}

function getCurrentAccountWithSendEtherInfo (state) {
  const currentAddress = getSelectedAddress(state)
  const accounts = accountsWithSendEtherInfoSelector(state)

  return accounts.find(({ address }) => address === currentAddress)
}

function transactionsSelector (state) {
  const { network, selectedTokenAddress } = state.metamask
  const unapprovedMsgs = valuesFor(state.metamask.unapprovedMsgs)
  const shapeShiftTxList = (network === '1') ? state.metamask.shapeShiftTxList : undefined
  const transactions = state.metamask.selectedAddressTxList || []
  const txsToRender = !shapeShiftTxList ? transactions.concat(unapprovedMsgs) : transactions.concat(unapprovedMsgs, shapeShiftTxList)

  console.log({txsToRender, selectedTokenAddress})
  return selectedTokenAddress
    ? txsToRender
      .filter(({ txParams: { to } }) => to === selectedTokenAddress)
      .sort((a, b) => b.time - a.time)
    : txsToRender
      .sort((a, b) => b.time - a.time)
}

function getGasPrice (state) {
  return state.metamask.send.gasPrice
}

function getGasLimit (state) {
  return state.metamask.send.gasLimit
}

function getSendFrom (state) {
  return state.metamask.send.from
}

function getCurrentCurrency (state) {
  return state.metamask.currentCurrency
}
