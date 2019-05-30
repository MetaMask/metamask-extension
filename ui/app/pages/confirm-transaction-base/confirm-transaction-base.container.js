import { connect } from 'react-redux'
import { compose } from 'recompose'
import { withRouter } from 'react-router-dom'
import R from 'ramda'
import contractMap from 'eth-contract-metadata'
import ConfirmTransactionBase from './confirm-transaction-base.component'
import {
  clearConfirmTransaction,
  updateGasAndCalculate,
} from '../../ducks/confirm-transaction/confirm-transaction.duck'
import { clearSend, cancelTx, cancelTxs, updateAndApproveTx, showModal, setMetaMetricsSendCount } from '../../store/actions'
import {
  INSUFFICIENT_FUNDS_ERROR_KEY,
  GAS_LIMIT_TOO_LOW_ERROR_KEY,
} from '../../helpers/constants/error-keys'
import { getHexGasTotal } from '../../helpers/utils/confirm-tx.util'
import { isBalanceSufficient, calcGasTotal } from '../send/send.utils'
import { conversionGreaterThan } from '../../helpers/utils/conversion-util'
import { MIN_GAS_LIMIT_DEC } from '../send/send.constants'
import { checksumAddress, addressSlicer, valuesFor } from '../../helpers/utils/util'
import {getMetaMaskAccounts, getAdvancedInlineGasShown, preferencesSelector, getIsMainnet} from '../../selectors/selectors'

const casedContractMap = Object.keys(contractMap).reduce((acc, base) => {
  return {
    ...acc,
    [base.toLowerCase()]: contractMap[base],
  }
}, {})

const mapStateToProps = (state, props) => {
  const { toAddress: propsToAddress } = props
  const { showFiatInTestnets } = preferencesSelector(state)
  const isMainnet = getIsMainnet(state)
  const { confirmTransaction, metamask, gas } = state
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
    tokenData,
    methodData,
    txData,
    tokenProps,
    nonce,
  } = confirmTransaction
  const { txParams = {}, lastGasPrice, id: transactionId } = txData
  const {
    from: fromAddress,
    to: txParamsToAddress,
    gasPrice,
    gas: gasLimit,
    value: amount,
  } = txParams
  const accounts = getMetaMaskAccounts(state)
  const {
    conversionRate,
    identities,
    currentCurrency,
    selectedAddress,
    selectedAddressTxList,
    assetImages,
    network,
    unapprovedTxs,
    metaMetricsSendCount,
  } = metamask
  const assetImage = assetImages[txParamsToAddress]

  const {
    customGasLimit,
    customGasPrice,
  } = gas

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

  const isTxReprice = Boolean(lastGasPrice)

  const transaction = R.find(({ id }) => id === transactionId)(selectedAddressTxList)
  const transactionStatus = transaction ? transaction.status : ''

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

  return {
    balance,
    fromAddress,
    fromName,
    toAddress,
    toName,
    ethTransactionAmount,
    ethTransactionFee,
    ethTransactionTotal,
    fiatTransactionAmount,
    fiatTransactionFee,
    fiatTransactionTotal,
    hexTransactionAmount,
    hexTransactionFee,
    hexTransactionTotal,
    txData,
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
      gasLimit: customGasLimit || gasLimit,
      gasPrice: customGasPrice || gasPrice,
    },
    advancedInlineGasShown: getAdvancedInlineGasShown(state),
    insufficientBalance,
    hideSubtitle: (!isMainnet && !showFiatInTestnets),
    hideFiatConversion: (!isMainnet && !showFiatInTestnets),
    metaMetricsSendCount,
  }
}

const mapDispatchToProps = dispatch => {
  return {
    clearConfirmTransaction: () => dispatch(clearConfirmTransaction()),
    clearSend: () => dispatch(clearSend()),
    showTransactionConfirmedModal: ({ onSubmit }) => {
      return dispatch(showModal({ name: 'TRANSACTION_CONFIRMED', onSubmit }))
    },
    showCustomizeGasModal: ({ txData, onSubmit, validate }) => {
      return dispatch(showModal({ name: 'CUSTOMIZE_GAS', txData, onSubmit, validate }))
    },
    updateGasAndCalculate: ({ gasLimit, gasPrice }) => {
      return dispatch(updateGasAndCalculate({ gasLimit, gasPrice }))
    },
    showRejectTransactionsConfirmationModal: ({ onSubmit, unapprovedTxCount }) => {
      return dispatch(showModal({ name: 'REJECT_TRANSACTIONS', onSubmit, unapprovedTxCount }))
    },
    cancelTransaction: ({ id }) => dispatch(cancelTx({ id })),
    cancelAllTransactions: (txList) => dispatch(cancelTxs(txList)),
    sendTransaction: txData => dispatch(updateAndApproveTx(txData)),
    setMetaMetricsSendCount: val => dispatch(setMetaMetricsSendCount(val)),
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
    updateGasAndCalculate: dispatchUpdateGasAndCalculate,
  }
}

export default compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps, mergeProps)
)(ConfirmTransactionBase)
