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
} from '../helpers/constants/transactions'
import { useCurrencyDisplay } from './useCurrencyDisplay'
import { useTokenDisplayValue } from './useTokenDisplayValue'
import { useTokenData } from './useTokenData'
import { tokenSelector } from '../selectors'

const SEND = 'send'
const DEPOSIT = 'deposit'
const INTERACTION = 'interaction'
const APPROVAL = 'approval'

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
  const methodData = useSelector((state) => getKnownMethodData(state, primaryTransaction?.txParams?.data)) || {}

  const actionKey = getTransactionActionKey(initialTransaction)
  const statusKey = getStatusKey(primaryTransaction)
  const status = statusKey in pendingStatusMap ? 'pending' : statusKey

  const primaryValue = primaryTransaction.txParams?.value
  let prefix = '-'
  const date = formatDateWithYearContext(initialTransaction.time || 0)
  let subtitle = date
  let recipientAddress = to

  const token = knownTokens.find((token) => token.address === recipientAddress)
  const tokenData = useTokenData(initialTransaction?.txParams?.data)
  const tokenDisplayValue = useTokenDisplayValue(initialTransaction?.txParams?.data, token)

  let category = SEND
  let title = t('sendETH')
  // There are four types of transaction entries that are currently differentiated in the design
  // 1. Send (sendEth sendTokens)
  // 2. Deposit
  // 3. Site interaction
  // 4. Approval
  if (transactionCategory === 'approve') {
    category = APPROVAL
    title = t('approveSpendLimit')
    subtitle += ` · ${initialTransaction.origin}`
  } else if (transactionCategory === 'contractDeployment' || transactionCategory === 'contractInteraction') {
    category = INTERACTION
    title = (methodData?.name && camelCaseToCapitalize(methodData.name)) || (actionKey && t(actionKey)) || ''
    subtitle += ` · ${initialTransaction.origin}`
  } else if (transactionCategory === 'incoming') {
    category = DEPOSIT
    title = t('deposit')
    prefix = ''
    subtitle += ` · From: ${shortenAddress(senderAddress)}`
  }

  if (transactionCategory === 'transfer') {
    title = t('sendSpecifiedTokens', [token?.symbol])
    recipientAddress = getTokenToAddress(tokenData.params)
    subtitle += ` · To: ${shortenAddress(recipientAddress)}`
  } else if (category === SEND) {
    subtitle += ` · To: ${shortenAddress(recipientAddress)}`
  }

  const primaryCurrencyPreferences = useUserPreferencedCurrency(PRIMARY)
  const secondaryCurrencyPreferences = useUserPreferencedCurrency(SECONDARY)

  const [primaryCurrency] = useCurrencyDisplay(primaryValue, { prefix, displayValue: tokenDisplayValue, suffix: token?.symbol, ...primaryCurrencyPreferences })
  const [secondaryCurrency] = useCurrencyDisplay(primaryValue, { prefix, displayValue: tokenDisplayValue, ...secondaryCurrencyPreferences })

  return { title, category, subtitle, primaryCurrency, senderAddress, recipientAddress, secondaryCurrency: token ? undefined : secondaryCurrency, status }
}
