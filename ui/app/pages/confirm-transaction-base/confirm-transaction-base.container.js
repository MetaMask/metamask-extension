import { connect } from 'react-redux'
import { compose } from 'recompose'
import { withRouter } from 'react-router-dom'
import R from 'ramda'
import contractMap from 'eth-contract-metadata'
import ConfirmTransactionBase from './confirm-transaction-base.component'
import {
  clearConfirmTransaction,
} from '../../ducks/confirm-transaction/confirm-transaction.duck'

import {
  updateCustomNonce,
  clearSend,
  cancelTx,
  cancelTxs,
  updateAndApproveTx,
  showModal,
  setMetaMetricsSendCount,
  updateTransaction,
  getNextNonce,
} from '../../store/actions'
import {
  INSUFFICIENT_FUNDS_ERROR_KEY,
  GAS_LIMIT_TOO_LOW_ERROR_KEY,
} from '../../helpers/constants/error-keys'
import { getHexGasTotal } from '../../helpers/utils/confirm-tx.util'
import { isBalanceSufficient, calcGasTotal } from '../send/send.utils'
import { conversionGreaterThan } from '../../helpers/utils/conversion-util'
import { MIN_GAS_LIMIT_DEC } from '../send/send.constants'
import { checksumAddress, addressSlicer, valuesFor } from '../../helpers/utils/util'
import { getMetaMaskAccounts, getCustomNonceValue, getUseNonceField, getAdvancedInlineGasShown, preferencesSelector, getIsMainnet, getKnownMethodData } from '../../selectors/selectors'
import { transactionFeeSelector } from '../../selectors/confirm-transaction'

const casedContractMap = Object.keys(contractMap).reduce((acc, base) => {
  return {
    ...acc,
    [base.toLowerCase()]: contractMap[base],
  }
}, {})

let customNonceValue = ''
const customNonceMerge = txData => customNonceValue ? ({
  ...txData,
  customNonceValue,
}) : txData

const mapStateToProps = (state, ownProps) => {
  const { toAddress: propsToAddress, match: { params = {} } } = ownProps
  const { id: paramsTransactionId } = params
  const { showFiatInTestnets } = preferencesSelector(state)
  const isMainnet = getIsMainnet(state)
  const { confirmTransaction, metamask } = state
  const {
    conversionRate,
    identities,
    addressBook,
    currentCurrency,
    selectedAddress,
    selectedAddressTxList,
    assetImages,
    network,
    unapprovedTxs,
    metaMetricsSendCount,
    nextNonce,
  } = metamask
  const {
    tokenData,
    txData,
    tokenProps,
    nonce,
  } = confirmTransaction
  const { txParams = {}, lastGasPrice, id: transactionId, transactionCategory } = txData
  const transaction = R.find(({ id }) => id === (transactionId || Number(paramsTransactionId)))(selectedAddressTxList) || {}
  const {
    from: fromAddress,
    to: txParamsToAddress,
    gasPrice,
    gas: gasLimit,
    value: amount,
    data,
  } = transaction && transaction.txParams || txParams
  const accounts = getMetaMaskAccounts(state)
  const assetImage = assetImages[txParamsToAddress]

  const { balance } = accounts[selectedAddress]
  const { name: fromName } = identities[selectedAddress]
  const toAddress = propsToAddress || txParamsToAddress
  const toName = identities[toAddress]
    ? identities[toAddress].name
    : (
      casedContractMap[toAddress]
        ? casedContractMap[toAddress].name
        : addressSlicer(checksumAddress(toAddress))
    )

  const addressBookObject = addressBook[checksumAddress(toAddress)]
  const toNickname = addressBookObject ? addressBookObject.name : ''
  const isTxReprice = Boolean(lastGasPrice)
  const transactionStatus = transaction ? transaction.status : ''

  const {
    ethTransactionAmount,
    ethTransactionFee,
    ethTransactionTotal,
    fiatTransactionAmount,
    fiatTransactionFee,
    fiatTransactionTotal,
    hexTransactionAmount,
    hexTransactionFee,
    hexTransactionTotal,
  } = transactionFeeSelector(state, transaction)

  if (transaction && transaction.simulationFails) {
    txData.simulationFails = transaction.simulationFails
  }

  const currentNetworkUnapprovedTxs = R.filter(
    ({ metamaskNetworkId }) => metamaskNetworkId === network,
    unapprovedTxs,
  )
  const unapprovedTxCount = valuesFor(currentNetworkUnapprovedTxs).length

  const insufficientBalance = !isBalanceSufficient({
    amount,
    gasTotal: calcGasTotal(gasLimit, gasPrice),
    balance,
    conversionRate,
  })

  const methodData = getKnownMethodData(state, data) || {}

  return {
    balance,
    fromAddress,
    fromName,
    toAddress,
    toName,
    toNickname,
    ethTransactionAmount,
    ethTransactionFee,
    ethTransactionTotal,
    fiatTransactionAmount,
    fiatTransactionFee,
    fiatTransactionTotal,
    hexTransactionAmount,
    hexTransactionFee,
    hexTransactionTotal,
    txData: { ...txData, ...transaction },
    tokenData,
    methodData,
    tokenProps,
    isTxReprice,
    currentCurrency,
    conversionRate,
    transactionStatus,
    nonce,
    assetImage,
    unapprovedTxs,
    unapprovedTxCount,
    currentNetworkUnapprovedTxs,
    customGas: {
      gasLimit,
      gasPrice,
    },
    advancedInlineGasShown: getAdvancedInlineGasShown(state),
    useNonceField: getUseNonceField(state),
    customNonceValue: getCustomNonceValue(state),
    insufficientBalance,
    hideSubtitle: (!isMainnet && !showFiatInTestnets),
    hideFiatConversion: (!isMainnet && !showFiatInTestnets),
    metaMetricsSendCount,
    transactionCategory,
    nextNonce,
  }
}

export const mapDispatchToProps = dispatch => {
  return {
    updateCustomNonce: value => {
      customNonceValue = value
      dispatch(updateCustomNonce(value))
    },
    clearConfirmTransaction: () => dispatch(clearConfirmTransaction()),
    clearSend: () => dispatch(clearSend()),
    showTransactionConfirmedModal: ({ onSubmit }) => {
      return dispatch(showModal({ name: 'TRANSACTION_CONFIRMED', onSubmit }))
    },
    showCustomizeGasModal: ({ txData, onSubmit, validate }) => {
      return dispatch(showModal({ name: 'CUSTOMIZE_GAS', txData, onSubmit, validate }))
    },
    updateGasAndCalculate: (updatedTx) => {
      return dispatch(updateTransaction(updatedTx))
    },
    showRejectTransactionsConfirmationModal: ({ onSubmit, unapprovedTxCount }) => {
      return dispatch(showModal({ name: 'REJECT_TRANSACTIONS', onSubmit, unapprovedTxCount }))
    },
    cancelTransaction: ({ id }) => dispatch(cancelTx({ id })),
    cancelAllTransactions: (txList) => dispatch(cancelTxs(txList)),
    sendTransaction: txData => dispatch(updateAndApproveTx(customNonceMerge(txData))),
    setMetaMetricsSendCount: val => dispatch(setMetaMetricsSendCount(val)),
    getNextNonce: () => dispatch(getNextNonce()),
  }
}

const getValidateEditGas = ({ balance, conversionRate, txData }) => {
  const { txParams: { value: amount } = {} } = txData

  return ({ gasLimit, gasPrice }) => {
    const gasTotal = getHexGasTotal({ gasLimit, gasPrice })
    const hasSufficientBalance = isBalanceSufficient({
      amount,
      gasTotal,
      balance,
      conversionRate,
    })

    if (!hasSufficientBalance) {
      return {
        valid: false,
        errorKey: INSUFFICIENT_FUNDS_ERROR_KEY,
      }
    }

    const gasLimitTooLow = gasLimit && conversionGreaterThan(
      {
        value: MIN_GAS_LIMIT_DEC,
        fromNumericBase: 'dec',
        conversionRate,
      },
      {
        value: gasLimit,
        fromNumericBase: 'hex',
      },
    )

    if (gasLimitTooLow) {
      return {
        valid: false,
        errorKey: GAS_LIMIT_TOO_LOW_ERROR_KEY,
      }
    }

    return {
      valid: true,
    }
  }
}

const mergeProps = (stateProps, dispatchProps, ownProps) => {
  const { balance, conversionRate, txData, unapprovedTxs } = stateProps
  const {
    cancelAllTransactions: dispatchCancelAllTransactions,
    showCustomizeGasModal: dispatchShowCustomizeGasModal,
    updateGasAndCalculate: dispatchUpdateGasAndCalculate,
    ...otherDispatchProps
  } = dispatchProps

  const validateEditGas = getValidateEditGas({ balance, conversionRate, txData })

  return {
    ...stateProps,
    ...otherDispatchProps,
    ...ownProps,
    showCustomizeGasModal: () => dispatchShowCustomizeGasModal({
      txData,
      onSubmit: customGas => dispatchUpdateGasAndCalculate(customGas),
      validate: validateEditGas,
    }),
    cancelAllTransactions: () => dispatchCancelAllTransactions(valuesFor(unapprovedTxs)),
    updateGasAndCalculate: ({ gasLimit, gasPrice }) => {
      const updatedTx = {
        ...txData,
        txParams: {
          ...txData.txParams,
          gas: gasLimit,
          gasPrice,
        },
      }
      dispatchUpdateGasAndCalculate(updatedTx)
    },
  }
}

export default compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps, mergeProps)
)(ConfirmTransactionBase)
