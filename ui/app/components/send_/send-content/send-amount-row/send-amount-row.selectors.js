import {
  getSelectedToken,
  getSelectedTokenToFiatRate,
  getConversionRate,
} from '../../send.selectors.js'

const selectors = {
  getAmountConversionRate,
  getMaxModeOn,
  getPrimaryCurrency,
  sendAmountIsInError,
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
  return getSelectedToken(state)
    ? getSelectedTokenToFiatRate(state)
    : getConversionRate(state)
}
