import { useSelector } from 'react-redux'
import { getKnownMethodData } from '../selectors/selectors'
import { getTransactionActionKey, getStatusKey } from '../helpers/utils/transactions.util'
import { camelCaseToCapitalize } from '../helpers/utils/common.util'
import { useI18nContext } from './useI18nContext'
import { PRIMARY, SECONDARY } from '../helpers/constants/common'
import { getTokenToAddress } from '../helpers/utils/token-util'
import { useUserPreferencedCurrency } from './useUserPreferencedCurrency'
import { formatDateWithYearContext, shortenAddress } from '../helpers/utils/util'
import {
  APPROVED_STATUS,
  SUBMITTED_STATUS,
  CONTRACT_INTERACTION_KEY,
  DEPLOY_CONTRACT_ACTION_KEY,
  INCOMING_TRANSACTION_KEY,
  TOKEN_METHOD_TRANSFER,
  TOKEN_METHOD_TRANSFER_FROM,
  SEND_ETHER_ACTION_KEY,
  TRANSACTION_CATEGORY_APPROVAL,
  TRANSACTION_CATEGORY_INTERACTION,
  TRANSACTION_CATEGORY_RECEIVE,
  TRANSACTION_CATEGORY_SEND,
  TRANSACTION_CATEGORY_SIGNATURE_REQUEST,
  PENDING_STATUS,
  TOKEN_METHOD_APPROVE,
} from '../helpers/constants/transactions'
import { useCurrencyDisplay } from './useCurrencyDisplay'
import { useTokenDisplayValue } from './useTokenDisplayValue'
import { useTokenData } from './useTokenData'
import { tokenSelector } from '../selectors'

// This is duplicated from transactions selectors, additionally
// from the history view we will already know the pending status
// of a transaction, but in order to make this hook less coupled
// to where it is used we should determine the pending status here
const pendingStatusMap = {
  [APPROVED_STATUS]: true,
  [SUBMITTED_STATUS]: true,
}

/**
 * @typedef {Object} TransactionDisplayData
 * @property {string} title               - primary description of the transaction
 * @property {string} subtitle            - supporting text describing the transaction
 * @property {string} category            - the transaction category
 * @property {string} primaryCurrency     - the currency string to display in the primary position
 * @property {string} [secondaryCurrency] - the currency string to display in the secondary position
 * @property {string} status              - the status of the transaction
 * @property {string} senderAddress       - the Ethereum address of the sender
 * @property {string} recipientAddress    - the Ethereum address of the recipient
 */

/**
 * useTransactionDisplayData
 *
 * The goal of this method is to perform all of the necessary computation and
 * state access required to take a transactionGroup and derive from it a shape
 * of data that can power all views related to a transaction. Presently the main
 * case is for shared logic between transaction-list-item and transaction-detail-view
 * @param {Object} transactionGroup group of transactions
 * @return {TransactionDisplayData}
 */
export function useTransactionDisplayData (transactionGroup) {
  const knownTokens = useSelector(tokenSelector)
  const t = useI18nContext()
  const { initialTransaction, primaryTransaction } = transactionGroup
  // initialTransaction contains the data we need to derive the primary purpose of this transaction group
  const { transactionCategory } = initialTransaction

  const { from: senderAddress, to } = initialTransaction.txParams || {}

  // for smart contract interactions, methodData can be used to derive the name of the action being taken
  const methodData = useSelector((state) => getKnownMethodData(state, initialTransaction?.txParams?.data)) || {}

  const actionKey = getTransactionActionKey(initialTransaction)
  const statusKey = getStatusKey(primaryTransaction)
  const status = statusKey in pendingStatusMap ? PENDING_STATUS : statusKey

  const primaryValue = primaryTransaction.txParams?.value
  let prefix = '-'
  const date = formatDateWithYearContext(initialTransaction.time || 0)
  let subtitle
  let recipientAddress = to

  const isTokenTransfer = transactionCategory === TOKEN_METHOD_TRANSFER || transactionCategory === TOKEN_METHOD_TRANSFER_FROM

  // these values are always instantiated because they are either
  // used by or returned from hooks. Hooks must be called at the top level,
  // so as an additional safeguard against inappropriately associating token
  // transfers, we explicitly pass undefined to the two following hook calls
  // if the transactionCategory doesn't indicate a token transfer.
  // These hooks will return null if any argument is null or undefined.
  const token = isTokenTransfer && knownTokens.find((token) => token.address === recipientAddress)
  const tokenData = useTokenData(isTokenTransfer && initialTransaction?.txParams?.data)
  const tokenDisplayValue = useTokenDisplayValue(isTokenTransfer && initialTransaction?.txParams?.data, token)

  let category
  let title
  // There are four types of transaction entries that are currently differentiated in the design
  // 1. (PENDING DESIGN) signature request
  // 2. Send (sendEth sendTokens)
  // 3. Deposit
  // 4. Site interaction
  // 5. Approval
  if (transactionCategory == null) {
    const origin = initialTransaction.msgParams?.origin || initialTransaction.origin
    category = TRANSACTION_CATEGORY_SIGNATURE_REQUEST
    title = t('signatureRequest')
    subtitle = origin || ''
  } else if (transactionCategory === TOKEN_METHOD_APPROVE) {
    category = TRANSACTION_CATEGORY_APPROVAL
    title = t('approveSpendLimit')
    subtitle = initialTransaction.origin
  } else if (transactionCategory === DEPLOY_CONTRACT_ACTION_KEY || transactionCategory === CONTRACT_INTERACTION_KEY) {
    category = TRANSACTION_CATEGORY_INTERACTION
    title = (methodData?.name && camelCaseToCapitalize(methodData.name)) || (actionKey && t(actionKey)) || ''
    subtitle = initialTransaction.origin
  } else if (transactionCategory === INCOMING_TRANSACTION_KEY) {
    category = TRANSACTION_CATEGORY_RECEIVE
    title = t('receive')
    prefix = ''
    subtitle = `${t('from')}: ${shortenAddress(senderAddress)}`
  } else if (isTokenTransfer) {
    category = TRANSACTION_CATEGORY_SEND
    title = t('sendSpecifiedTokens', [token?.symbol || t('token')])
    recipientAddress = getTokenToAddress(tokenData.params)
    subtitle = `${t('to')}: ${shortenAddress(recipientAddress)}`
  } else if (transactionCategory === SEND_ETHER_ACTION_KEY) {
    category = TRANSACTION_CATEGORY_SEND
    title = t('sendETH')
    subtitle = `${t('to')}: ${shortenAddress(recipientAddress)}`
  }

  const primaryCurrencyPreferences = useUserPreferencedCurrency(PRIMARY)
  const secondaryCurrencyPreferences = useUserPreferencedCurrency(SECONDARY)

  const [primaryCurrency] = useCurrencyDisplay(primaryValue, {
    prefix,
    displayValue: isTokenTransfer && tokenDisplayValue,
    suffix: token?.symbol,
    ...primaryCurrencyPreferences,
  })

  const [secondaryCurrency] = useCurrencyDisplay(primaryValue, {
    prefix,
    displayValue: isTokenTransfer && tokenDisplayValue,
    ...secondaryCurrencyPreferences,
  })

  return {
    title,
    category,
    date,
    subtitle,
    primaryCurrency,
    senderAddress,
    recipientAddress,
    secondaryCurrency: isTokenTransfer ? undefined : secondaryCurrency,
    status,
  }
}
