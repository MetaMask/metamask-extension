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
    showEdit: PropTypes.bool,
    onEdit: PropTypes.func,
    // Sender to Recipient
    fromName: PropTypes.string,
    fromAddress: PropTypes.string,
    toName: PropTypes.string,
    toAddress: PropTypes.string,

    valid: PropTypes.bool,
    errorMessage: PropTypes.string,
    // Header
    action: PropTypes.string,
    title: PropTypes.string,
    titleComponent: PropTypes.func,
    subtitle: PropTypes.string,
    hideSubtitle: PropTypes.bool,
    // Content
    summaryComponent: PropTypes.node,
    contentComponent: PropTypes.node,
    fiatTransactionAmount: PropTypes.string,
    fiatTransactionFee: PropTypes.string,
    fiatTransactionTotal: PropTypes.string,
    ethTransactionAmount: PropTypes.string,
    ethTransactionFee: PropTypes.string,
    ethTransactionTotal: PropTypes.string,
    onEditGas: PropTypes.func,
    detailsComponent: PropTypes.node,
    dataComponent: PropTypes.node,
    identiconAddress: PropTypes.string,
    nonce: PropTypes.string,
    warning: PropTypes.string,
    // Footer
    onCancel: PropTypes.func,
    onSubmit: PropTypes.func,
  }

  render () {
    const {
      showEdit,
      onEdit,
      fromName,
      fromAddress,
      toName,
      toAddress,
      valid,
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
          disabled={!valid}
        />
      </div>
    )
  }
}
