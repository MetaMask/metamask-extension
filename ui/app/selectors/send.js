import abi from 'human-standard-token-abi'
import {
  accountsWithSendEtherInfoSelector,
  getAddressBook,
  getSelectedAccount,
  getTargetAccount,
  getAveragePriceEstimateInHexWEI,
} from '.'
import { estimateGasPriceFromRecentBlocks, calcGasTotal } from '../pages/send/send.utils'

export function getBlockGasLimit (state) {
  return state.metamask.currentBlockGasLimit
}

export function getConversionRate (state) {
  return state.metamask.conversionRate
}

export function getNativeCurrency (state) {
  return state.metamask.nativeCurrency
}

export function getCurrentNetwork (state) {
  return state.metamask.network
}

export function getGasLimit (state) {
  return state.metamask.send.gasLimit || '0'
}

export function getGasPrice (state) {
  return state.metamask.send.gasPrice || getAveragePriceEstimateInHexWEI(state)
}

export function getGasPriceFromRecentBlocks (state) {
  return estimateGasPriceFromRecentBlocks(state.metamask.recentBlocks)
}

export function getGasTotal (state) {
  return calcGasTotal(getGasLimit(state), getGasPrice(state))
}

export function getPrimaryCurrency (state) {
  const selectedToken = getSelectedToken(state)
  return selectedToken && selectedToken.symbol
}

export function getRecentBlocks (state) {
  return state.metamask.recentBlocks
}

export function getSelectedToken (state) {
  const tokens = state.metamask.tokens || []
  const selectedTokenAddress = state.metamask.selectedTokenAddress
  const selectedToken = tokens.filter(({ address }) => address === selectedTokenAddress)[0]
  const sendToken = state.metamask?.send.token

  return selectedToken || sendToken || null
}

export function getSelectedTokenContract (state) {
  const selectedToken = getSelectedToken(state)
  return selectedToken
    ? global.eth.contract(abi).at(selectedToken.address)
    : null
}

export function getSendAmount (state) {
  return state.metamask.send.amount
}

export function getSendHexData (state) {
  return state.metamask.send.data
}

export function getSendHexDataFeatureFlagState (state) {
  return state.metamask.featureFlags.sendHexData
}

export function getSendEditingTransactionId (state) {
  return state.metamask.send.editingTransactionId
}

export function getSendErrors (state) {
  return state.send.errors
}

export function sendAmountIsInError (state) {
  return Boolean(state.send.errors.amount)
}

export function getSendFrom (state) {
  return state.metamask.send.from
}

export function getSendFromBalance (state) {
  const fromAccount = getSendFromObject(state)
  return fromAccount.balance
}

export function getSendFromObject (state) {
  const fromAddress = getSendFrom(state)
  return fromAddress
    ? getTargetAccount(state, fromAddress)
    : getSelectedAccount(state)
}

export function getSendMaxModeState (state) {
  return state.metamask.send.maxModeOn
}

export function getSendTo (state) {
  return state.metamask.send.to
}

export function getSendToNickname (state) {
  return state.metamask.send.toNickname
}

export function getSendToAccounts (state) {
  const fromAccounts = accountsWithSendEtherInfoSelector(state)
  const addressBookAccounts = getAddressBook(state)
  return [...fromAccounts, ...addressBookAccounts]
}
export function getTokenBalance (state) {
  return state.metamask.send.tokenBalance
}

export function getSendEnsResolution (state) {
  return state.metamask.send.ensResolution
}

export function getSendEnsResolutionError (state) {
  return state.metamask.send.ensResolutionError
}

export function getUnapprovedTxs (state) {
  return state.metamask.unapprovedTxs
}

export function getQrCodeData (state) {
  return state.appState.qrCodeData
}

export function getGasLoadingError (state) {
  return state.send.errors.gasLoading
}

export function gasFeeIsInError (state) {
  return Boolean(state.send.errors.gasFee)
}

export function getGasButtonGroupShown (state) {
  return state.send.gasButtonGroupShown
}

export function getTokens (state) {
  return state.metamask.tokens
}

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

export function isSendFormInError (state) {
  return Object.values(getSendErrors(state)).some((n) => n)
}
