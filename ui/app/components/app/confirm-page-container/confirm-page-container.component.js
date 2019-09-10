import React, { Component } from 'react'
import PropTypes from 'prop-types'
import SenderToRecipient from '../../ui/sender-to-recipient'
import { PageContainerFooter } from '../../ui/page-container'
import { ConfirmPageContainerHeader, ConfirmPageContainerContent, ConfirmPageContainerNavigation } from '.'

export default class ConfirmPageContainer extends Component {
  static contextTypes = {
    t: PropTypes.func,
  }

  static propTypes = {
    // Header
    action: PropTypes.string,
    hideSubtitle: PropTypes.bool,
    onEdit: PropTypes.func,
    showEdit: PropTypes.bool,
    subtitle: PropTypes.string,
    subtitleComponent: PropTypes.node,
    title: PropTypes.string,
    titleComponent: PropTypes.node,
    // Sender to Recipient
    fromAddress: PropTypes.string,
    fromName: PropTypes.string,
    toAddress: PropTypes.string,
    toName: PropTypes.string,
    toNickname: PropTypes.string,
    // Content
    contentComponent: PropTypes.node,
    errorKey: PropTypes.string,
    errorMessage: PropTypes.string,
    fiatTransactionAmount: PropTypes.string,
    fiatTransactionFee: PropTypes.string,
    fiatTransactionTotal: PropTypes.string,
    ethTransactionAmount: PropTypes.string,
    ethTransactionFee: PropTypes.string,
    ethTransactionTotal: PropTypes.string,
    onEditGas: PropTypes.func,
    dataComponent: PropTypes.node,
    detailsComponent: PropTypes.node,
    identiconAddress: PropTypes.string,
    nonce: PropTypes.string,
    assetImage: PropTypes.string,
    summaryComponent: PropTypes.node,
    warning: PropTypes.string,
    unapprovedTxCount: PropTypes.number,
    // Navigation
    totalTx: PropTypes.number,
    positionOfCurrentTx: PropTypes.number,
    nextTxId: PropTypes.string,
    prevTxId: PropTypes.string,
    showNavigation: PropTypes.bool,
    onNextTx: PropTypes.func,
    firstTx: PropTypes.string,
    lastTx: PropTypes.string,
    ofText: PropTypes.string,
    requestsWaitingText: PropTypes.string,
    // Footer
    onCancelAll: PropTypes.func,
    onCancel: PropTypes.func,
    onSubmit: PropTypes.func,
    disabled: PropTypes.bool,
  }

  render () {
    const {
      showEdit,
      onEdit,
      fromName,
      fromAddress,
      toName,
      toNickname,
      toAddress,
      disabled,
      errorKey,
      errorMessage,
      contentComponent,
      action,
      title,
      titleComponent,
      subtitle,
      subtitleComponent,
      hideSubtitle,
      summaryComponent,
      detailsComponent,
      dataComponent,
      onCancelAll,
      onCancel,
      onSubmit,
      identiconAddress,
      nonce,
      unapprovedTxCount,
      assetImage,
      warning,
      totalTx,
      positionOfCurrentTx,
      nextTxId,
      prevTxId,
      showNavigation,
      onNextTx,
      firstTx,
      lastTx,
      ofText,
      requestsWaitingText,
    } = this.props
    const renderAssetImage = contentComponent || (!contentComponent && !identiconAddress)

    return (
      <div className="page-container">
        <ConfirmPageContainerNavigation
          totalTx={totalTx}
          positionOfCurrentTx={positionOfCurrentTx}
          nextTxId={nextTxId}
          prevTxId={prevTxId}
          showNavigation={showNavigation}
          onNextTx={(txId) => onNextTx(txId)}
          firstTx={firstTx}
          lastTx={lastTx}
          ofText={ofText}
          requestsWaitingText={requestsWaitingText}
        />
        <ConfirmPageContainerHeader
          showEdit={showEdit}
          onEdit={() => onEdit()}
        >
          <SenderToRecipient
            senderName={fromName}
            senderAddress={fromAddress}
            recipientName={toName}
            recipientAddress={toAddress}
            recipientNickname={toNickname}
            assetImage={renderAssetImage ? assetImage : undefined}
          />
        </ConfirmPageContainerHeader>
        {
          contentComponent || (
            <ConfirmPageContainerContent
              action={action}
              title={title}
              titleComponent={titleComponent}
              subtitle={subtitle}
              subtitleComponent={subtitleComponent}
              hideSubtitle={hideSubtitle}
              summaryComponent={summaryComponent}
              detailsComponent={detailsComponent}
              dataComponent={dataComponent}
              errorMessage={errorMessage}
              errorKey={errorKey}
              identiconAddress={identiconAddress}
              nonce={nonce}
              assetImage={assetImage}
              warning={warning}
            />
          )
        }
        <PageContainerFooter
          onCancel={() => onCancel()}
          cancelText={this.context.t('reject')}
          onSubmit={() => onSubmit()}
          submitText={this.context.t('confirm')}
          submitButtonType="confirm"
          disabled={disabled}
        >
          {unapprovedTxCount > 1 && (
            <a onClick={() => onCancelAll()}>
              {this.context.t('rejectTxsN', [unapprovedTxCount])}
            </a>
          )}
        </PageContainerFooter>
      </div>
    )
  }
}
