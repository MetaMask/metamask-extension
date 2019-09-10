const {
  getSelectedToken,
  getSendEditingTransactionId,
  getSendTo,
} = require('../send.selectors.js')

const selectors = {
  getTitleKey,
  getSubtitleParams,
}

module.exports = selectors

function getTitleKey (state) {
  const isEditing = Boolean(getSendEditingTransactionId(state))
  const isToken = Boolean(getSelectedToken(state))

  if (!getSendTo(state)) {
    return 'addRecipient'
  }

  if (isEditing) {
    return 'edit'
  } else if (isToken) {
    return 'sendTokens'
  } else {
    return 'sendETH'
  }
}

function getSubtitleParams (state) {
  const isEditing = Boolean(getSendEditingTransactionId(state))
  const token = getSelectedToken(state)

  if (isEditing) {
    return [ 'editingTransaction' ]
  } else if (token) {
    return [ 'onlySendTokensToAccountAddress', [ token.symbol ] ]
  } else {
    return [ 'onlySendToEtherAddress' ]
  }
}
