import React, { Component } from 'react'
import PropTypes from 'prop-types'
import SenderToRecipient from '../sender-to-recipient'
import { PageContainerFooter } from '../page-container'
import { ConfirmPageContainerHeader, ConfirmPageContainerContent } from './'

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
    title: PropTypes.string,
    titleComponent: PropTypes.func,
    // Sender to Recipient
    fromAddress: PropTypes.string,
    fromName: PropTypes.string,
    toAddress: PropTypes.string,
    toName: PropTypes.string,
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
    summaryComponent: PropTypes.node,
    warning: PropTypes.string,
    // Footer
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
      toAddress,
      disabled,
      errorKey,
      errorMessage,
      contentComponent,
      action,
      title,
      titleComponent,
      subtitle,
      hideSubtitle,
      summaryComponent,
      detailsComponent,
      dataComponent,
      onCancel,
      onSubmit,
      identiconAddress,
      nonce,
      warning,
    } = this.props

    return (
      <div className="page-container">
        <ConfirmPageContainerHeader
          showEdit={showEdit}
          onEdit={() => onEdit()}
        >
          <SenderToRecipient
            senderName={fromName}
            senderAddress={fromAddress}
            recipientName={toName}
            recipientAddress={toAddress}
          />
        </ConfirmPageContainerHeader>
        {
          contentComponent || (
            <ConfirmPageContainerContent
              action={action}
              title={title}
              titleComponent={titleComponent}
              subtitle={subtitle}
              hideSubtitle={hideSubtitle}
              summaryComponent={summaryComponent}
              detailsComponent={detailsComponent}
              dataComponent={dataComponent}
              errorMessage={errorMessage}
              errorKey={errorKey}
              identiconAddress={identiconAddress}
              nonce={nonce}
              warning={warning}
            />
          )
        }
        <PageContainerFooter
          onCancel={() => onCancel()}
          onSubmit={() => onSubmit()}
          submitText={this.context.t('confirm')}
          submitButtonType="confirm"
          disabled={disabled}
        />
      </div>
    )
  }
}
