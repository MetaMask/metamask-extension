import { getSelectedToken, getSendEditingTransactionId, getSendTo } from '../send.selectors.js'
import { isEthereumNetwork } from '../../../selectors/selectors'

export function getTitleKey (state) {
  const isEditing = Boolean(getSendEditingTransactionId(state))
  const isToken = Boolean(getSelectedToken(state))
  const isEthereum = isEthereumNetwork(state)

  if (!getSendTo(state)) {
    return 'addRecipient'
  }

  if (isEditing) {
    return 'edit'
  } else if (isToken) {
    return 'sendTokens'
  } else if (!isEthereum) {
    return 'send'
  } else {
    return 'sendETH'
  }
}
