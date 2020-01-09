import { getSelectedToken, getSendEditingTransactionId, getSendTo } from '../send.selectors.js'

export function getTitleKey (state) {
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
