const valuesFor = require('./util').valuesFor

const selectors = {
  getSelectedAddress,
  getSelectedIdentity,
  getSelectedAccount,
  getSelectedToken,
  conversionRateSelector,
  transactionsSelector,
}

module.exports = selectors

function getSelectedAddress (state) {
  // TODO: accounts is not defined. Is it needed?
  const selectedAddress = state.metamask.selectedAddress || Object.keys(accounts)[0]

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

function conversionRateSelector (state) {
  return state.metamask.conversionRate
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
