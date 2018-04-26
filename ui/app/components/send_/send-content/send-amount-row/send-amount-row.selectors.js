import {
  getSelectedToken,
  getSelectedTokenToFiatRate,
  getConversionRate,
} from '../../send.selectors.js'

const selectors = {
  getMaxModeOn,
  sendAmountIsInError,
  getPrimaryCurrency,
  getAmountConversionRate,
}

module.exports = selectors

function getMaxModeOn (state) {
  return state.metamask.send.maxModeOn
}

function sendAmountIsInError (state) {
  return Boolean(state.metamask.send.errors.amount)
}

function getPrimaryCurrency (state) {
  const selectedToken = getSelectedToken(state)
  return selectedToken && selectedToken.symbol
}

function getAmountConversionRate (state) {
  return Boolean(getSelectedToken(state))
    ? getSelectedTokenToFiatRate(state)
    : getConversionRate(state)
}
