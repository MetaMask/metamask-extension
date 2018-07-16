import React, { Component } from 'react'
import PropTypes from 'prop-types'
import ConfirmPageContainer, { ConfirmDetailRow } from '../../confirm-page-container'
import { formatCurrency } from '../../../helpers/confirm-transaction/util'
import { isBalanceSufficient } from '../../send/send.utils'
import { DEFAULT_ROUTE } from '../../../routes'
import {
  INSUFFICIENT_FUNDS_ERROR_KEY,
  TRANSACTION_ERROR_KEY,
} from '../../../constants/error-keys'

export default class ConfirmTransactionBase extends Component {
  static contextTypes = {
    t: PropTypes.func,
  }

  static propTypes = {
    // react-router props
    match: PropTypes.object,
    history: PropTypes.object,
    // Redux props
    balance: PropTypes.string,
    cancelTransaction: PropTypes.func,
    clearConfirmTransaction: PropTypes.func,
    clearSend: PropTypes.func,
    conversionRate: PropTypes.number,
    currentCurrency: PropTypes.string,
    editTransaction: PropTypes.func,
    ethTransactionAmount: PropTypes.string,
    ethTransactionFee: PropTypes.string,
    ethTransactionTotal: PropTypes.string,
    fiatTransactionAmount: PropTypes.string,
    fiatTransactionFee: PropTypes.string,
    fiatTransactionTotal: PropTypes.string,
    fromAddress: PropTypes.string,
    fromName: PropTypes.string,
    hexGasTotal: PropTypes.string,
    isTxReprice: PropTypes.bool,
    methodData: PropTypes.object,
    nonce: PropTypes.string,
    sendTransaction: PropTypes.func,
    showCustomizeGasModal: PropTypes.func,
    showTransactionConfirmedModal: PropTypes.func,
    toAddress: PropTypes.string,
    tokenData: PropTypes.object,
    tokenProps: PropTypes.object,
    toName: PropTypes.string,
    transactionStatus: PropTypes.string,
    txData: PropTypes.object,
    // Component props
    action: PropTypes.string,
    contentComponent: PropTypes.node,
    dataComponent: PropTypes.node,
    detailsComponent: PropTypes.node,
    errorKey: PropTypes.string,
    errorMessage: PropTypes.string,
    hideData: PropTypes.bool,
    hideDetails: PropTypes.bool,
    hideSubtitle: PropTypes.bool,
    identiconAddress: PropTypes.string,
    onCancel: PropTypes.func,
    onEdit: PropTypes.func,
    onEditGas: PropTypes.func,
    onSubmit: PropTypes.func,
    subtitle: PropTypes.string,
    summaryComponent: PropTypes.node,
    title: PropTypes.string,
    valid: PropTypes.bool,
    warning: PropTypes.string,
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

  getErrorKey () {
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
        errorKey: INSUFFICIENT_FUNDS_ERROR_KEY,
      }
    }

    if (simulationFails) {
      return {
        valid: false,
        errorKey: TRANSACTION_ERROR_KEY,
      }
    }

    return {
      valid: true,
    }
  }

  handleEditGas () {
    const { onEditGas, showCustomizeGasModal } = this.props

    if (onEditGas) {
      onEditGas()
    } else {
      showCustomizeGasModal()
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
      errorMessage,
      errorKey: propsErrorKey,
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
    const { valid, errorKey } = this.getErrorKey()

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
        errorMessage={errorMessage}
        errorKey={propsErrorKey || errorKey}
        warning={warning}
        valid={propsValid || valid}
        onEdit={() => this.handleEdit()}
        onCancel={() => this.handleCancel()}
        onSubmit={() => this.handleSubmit()}
      />
    )
  }
}
