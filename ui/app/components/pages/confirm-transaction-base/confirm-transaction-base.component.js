import React, { Component } from 'react'
import PropTypes from 'prop-types'
import ConfirmPageContainer, { ConfirmDetailRow } from '../../confirm-page-container'
import { formatCurrency, getHexGasTotal } from '../../../helpers/confirm-transaction/util'
import { isBalanceSufficient } from '../../send_/send.utils'
import { DEFAULT_ROUTE } from '../../../routes'
import { conversionGreaterThan } from '../../../conversion-util'
import { MIN_GAS_LIMIT_DEC } from '../../send_/send.constants'

export default class ConfirmTransactionBase extends Component {
  static contextTypes = {
    t: PropTypes.func,
  }

  static propTypes = {
    match: PropTypes.object,
    history: PropTypes.object,
    // Redux props
    txData: PropTypes.object,
    tokenData: PropTypes.object,
    methodData: PropTypes.object,
    tokenProps: PropTypes.object,
    isTxReprice: PropTypes.bool,
    nonce: PropTypes.string,
    fromName: PropTypes.string,
    fromAddress: PropTypes.string,
    toName: PropTypes.string,
    toAddress: PropTypes.string,
    transactionStatus: PropTypes.string,
    ethTransactionAmount: PropTypes.string,
    ethTransactionFee: PropTypes.string,
    ethTransactionTotal: PropTypes.string,
    fiatTransactionAmount: PropTypes.string,
    fiatTransactionFee: PropTypes.string,
    fiatTransactionTotal: PropTypes.string,
    hexGasTotal: PropTypes.string,
    balance: PropTypes.string,
    currentCurrency: PropTypes.string,
    conversionRate: PropTypes.number,
    clearConfirmTransaction: PropTypes.func,
    cancelTransaction: PropTypes.func,
    clearSend: PropTypes.func,
    sendTransaction: PropTypes.func,
    editTransaction: PropTypes.func,
    showCustomizeGasModal: PropTypes.func,
    updateGasAndCalculate: PropTypes.func,
    showTransactionConfirmedModal: PropTypes.func,
    // Component props
    action: PropTypes.string,
    hideDetails: PropTypes.bool,
    hideData: PropTypes.bool,
    detailsComponent: PropTypes.node,
    dataComponent: PropTypes.node,
    summaryComponent: PropTypes.node,
    contentComponent: PropTypes.node,
    title: PropTypes.string,
    subtitle: PropTypes.string,
    hideSubtitle: PropTypes.bool,
    valid: PropTypes.bool,
    errorMessage: PropTypes.string,
    warning: PropTypes.string,
    identiconAddress: PropTypes.string,
    onEdit: PropTypes.func,
    onEditGas: PropTypes.func,
    onCancel: PropTypes.func,
    onSubmit: PropTypes.func,
  }

  componentDidUpdate () {
    const {
      transactionStatus,
      showTransactionConfirmedModal,
      history,
      clearConfirmTransaction,
    } = this.props

    if (transactionStatus === 'dropped') {
      showTransactionConfirmedModal({
        onHide: () => {
          clearConfirmTransaction()
          history.push(DEFAULT_ROUTE)
        },
      })

      return
    }
  }

  getError () {
    const INSUFFICIENT_FUNDS_ERROR = this.context.t('insufficientFunds')
    const TRANSACTION_ERROR = this.context.t('transactionError')
    const {
      balance,
      conversionRate,
      hexGasTotal,
      txData: {
        simulationFails,
        txParams: {
          value: amount,
        } = {},
      } = {},
    } = this.props

    const insufficientBalance = balance && !isBalanceSufficient({
      amount,
      gasTotal: hexGasTotal || '0x0',
      balance,
      conversionRate,
    })

    if (insufficientBalance) {
      return {
        valid: false,
        errorMessage: INSUFFICIENT_FUNDS_ERROR,
      }
    }

    if (simulationFails) {
      return {
        valid: false,
        errorMessage: TRANSACTION_ERROR,
      }
    }

    return {
      valid: true,
    }
  }

  validateEditGas ({ gasLimit, gasPrice }) {
    const { t } = this.context
    const {
      balance,
      conversionRate,
      txData: {
        txParams: {
          value: amount,
        } = {},
      } = {},
    } = this.props

    const INSUFFICIENT_FUNDS_ERROR = t('insufficientFunds')
    const GAS_LIMIT_TOO_LOW_ERROR = t('gasLimitTooLow')

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
        errorMessage: INSUFFICIENT_FUNDS_ERROR,
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
        errorMessage: GAS_LIMIT_TOO_LOW_ERROR,
      }
    }

    return {
      valid: true,
    }
  }

  handleEditGas () {
    const { onEditGas, showCustomizeGasModal, txData, updateGasAndCalculate } = this.props

    if (onEditGas) {
      onEditGas()
    } else {
      showCustomizeGasModal({
        txData,
        onSubmit: txData => updateGasAndCalculate(txData),
        validate: ({ gasLimit, gasPrice }) => this.validateEditGas({ gasLimit, gasPrice }),
      })
    }
  }

  renderDetails () {
    const {
      detailsComponent,
      fiatTransactionFee,
      ethTransactionFee,
      currentCurrency,
      fiatTransactionTotal,
      ethTransactionTotal,
      hideDetails,
    } = this.props

    if (hideDetails) {
      return null
    }

    return (
      detailsComponent || (
        <div className="confirm-page-container-content__details">
          <div className="confirm-page-container-content__gas-fee">
            <ConfirmDetailRow
              label="Gas Fee"
              fiatFee={formatCurrency(fiatTransactionFee, currentCurrency)}
              ethFee={ethTransactionFee}
              headerText="Edit"
              headerTextClassName="confirm-detail-row__header-text--edit"
              onHeaderClick={() => this.handleEditGas()}
            />
          </div>
          <div>
            <ConfirmDetailRow
              label="Total"
              fiatFee={formatCurrency(fiatTransactionTotal, currentCurrency)}
              ethFee={ethTransactionTotal}
              headerText="Amount + Gas Fee"
              headerTextClassName="confirm-detail-row__header-text--total"
              fiatFeeColor="#2f9ae0"
            />
          </div>
        </div>
      )
    )
  }

  renderData () {
    const { t } = this.context
    const {
      txData: {
        txParams: {
          data,
        } = {},
      } = {},
      methodData: {
        name,
        params,
      } = {},
      hideData,
      dataComponent,
    } = this.props

    if (hideData) {
      return null
    }

    return dataComponent || (
      <div className="confirm-page-container-content__data">
        <div className="confirm-page-container-content__data-box-label">
          {`${t('functionType')}:`}
          <span className="confirm-page-container-content__function-type">
            { name }
          </span>
        </div>
        <div className="confirm-page-container-content__data-box">
          <div className="confirm-page-container-content__data-field-label">
            { `${t('parameters')}:` }
          </div>
          <div>
            <pre>{ JSON.stringify(params, null, 2) }</pre>
          </div>
        </div>
        <div className="confirm-page-container-content__data-box-label">
          {`${t('hexData')}:`}
        </div>
        <div className="confirm-page-container-content__data-box">
          { data }
        </div>
      </div>
    )
  }

  handleEdit () {
    const { txData, tokenData, tokenProps, onEdit } = this.props
    onEdit({ txData, tokenData, tokenProps })
  }

  handleCancel () {
    const { onCancel, txData, cancelTransaction, history, clearConfirmTransaction } = this.props

    if (onCancel) {
      onCancel(txData)
    } else {
      cancelTransaction(txData)
        .then(() => {
          clearConfirmTransaction()
          history.push(DEFAULT_ROUTE)
        })
    }
  }

  handleSubmit () {
    const { sendTransaction, clearConfirmTransaction, txData, history, onSubmit } = this.props

    if (onSubmit) {
      onSubmit(txData)
    } else {
      sendTransaction(txData)
        .then(() => {
          clearConfirmTransaction()
          history.push(DEFAULT_ROUTE)
        })
    }
  }

  render () {
    const {
      isTxReprice,
      fromName,
      fromAddress,
      toName,
      toAddress,
      methodData,
      ethTransactionAmount,
      fiatTransactionAmount,
      valid: propsValid,
      errorMessage: propsErrorMessage,
      currentCurrency,
      action,
      title,
      subtitle,
      hideSubtitle,
      identiconAddress,
      summaryComponent,
      contentComponent,
      onEdit,
      nonce,
      warning,
    } = this.props

    const { name } = methodData
    const fiatConvertedAmount = formatCurrency(fiatTransactionAmount, currentCurrency)
    const { valid, errorMessage } = this.getError()

    return (
      <ConfirmPageContainer
        fromName={fromName}
        fromAddress={fromAddress}
        toName={toName}
        toAddress={toAddress}
        showEdit={onEdit && !isTxReprice}
        action={action || name}
        title={title || `${fiatConvertedAmount} ${currentCurrency.toUpperCase()}`}
        subtitle={subtitle || `\u2666 ${ethTransactionAmount}`}
        hideSubtitle={hideSubtitle}
        summaryComponent={summaryComponent}
        detailsComponent={this.renderDetails()}
        dataComponent={this.renderData()}
        contentComponent={contentComponent}
        nonce={nonce}
        identiconAddress={identiconAddress}
        errorMessage={propsErrorMessage || errorMessage}
        warning={warning}
        valid={propsValid || valid}
        onEdit={() => this.handleEdit()}
        onCancel={() => this.handleCancel()}
        onSubmit={() => this.handleSubmit()}
      />
    )
  }
}
