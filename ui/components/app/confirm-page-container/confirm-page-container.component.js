import React, { Component } from 'react';
import PropTypes from 'prop-types';

import { EDIT_GAS_MODES } from '../../../../shared/constants/gas';
import { GasFeeContextProvider } from '../../../contexts/gasFee';
import { TRANSACTION_TYPES } from '../../../../shared/constants/transaction';

import { PageContainerFooter } from '../../ui/page-container';
import Dialog from '../../ui/dialog';
import ErrorMessage from '../../ui/error-message';
import SenderToRecipient from '../../ui/sender-to-recipient';

import NicknamePopovers from '../modals/nickname-popovers';

import AdvancedGasFeePopover from '../advanced-gas-fee-popover';
import EditGasFeePopover from '../edit-gas-fee-popover/edit-gas-fee-popover';
import EditGasPopover from '../edit-gas-popover';

import {
  ConfirmPageContainerHeader,
  ConfirmPageContainerContent,
  ConfirmPageContainerNavigation,
} from '.';

export default class ConfirmPageContainer extends Component {
  state = {
    showNicknamePopovers: false,
  };

  static contextTypes = {
    t: PropTypes.func,
  };

  static propTypes = {
    // Header
    action: PropTypes.string,
    hideSubtitle: PropTypes.bool,
    onEdit: PropTypes.func,
    showEdit: PropTypes.bool,
    subtitleComponent: PropTypes.node,
    title: PropTypes.string,
    titleComponent: PropTypes.node,
    hideSenderToRecipient: PropTypes.bool,
    showAccountInHeader: PropTypes.bool,
    // Sender to Recipient
    fromAddress: PropTypes.string,
    fromName: PropTypes.string,
    toAddress: PropTypes.string,
    toName: PropTypes.string,
    toEns: PropTypes.string,
    toNickname: PropTypes.string,
    // Content
    contentComponent: PropTypes.node,
    errorKey: PropTypes.string,
    errorMessage: PropTypes.string,
    dataComponent: PropTypes.node,
    dataHexComponent: PropTypes.node,
    detailsComponent: PropTypes.node,
    identiconAddress: PropTypes.string,
    nonce: PropTypes.string,
    warning: PropTypes.string,
    unapprovedTxCount: PropTypes.number,
    origin: PropTypes.string.isRequired,
    ethGasPriceWarning: PropTypes.string,
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
    editingGas: PropTypes.bool,
    handleCloseEditGas: PropTypes.func,
    // Gas Popover
    currentTransaction: PropTypes.object.isRequired,
    contact: PropTypes.object,
    isOwnedAccount: PropTypes.bool,
    supportsEIP1559V2: PropTypes.bool,
  };

  render() {
    const {
      showEdit,
      onEdit,
      fromName,
      fromAddress,
      toName,
      toEns,
      toNickname,
      toAddress,
      disabled,
      errorKey,
      errorMessage,
      contentComponent,
      action,
      title,
      titleComponent,
      subtitleComponent,
      hideSubtitle,
      detailsComponent,
      dataComponent,
      dataHexComponent,
      onCancelAll,
      onCancel,
      onSubmit,
      identiconAddress,
      nonce,
      unapprovedTxCount,
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
      hideSenderToRecipient,
      showAccountInHeader,
      origin,
      ethGasPriceWarning,
      editingGas,
      handleCloseEditGas,
      currentTransaction,
      contact = {},
      isOwnedAccount,
      supportsEIP1559V2,
    } = this.props;

    const showAddToAddressDialog =
      !contact.name && toAddress && !isOwnedAccount && !hideSenderToRecipient;

    const shouldDisplayWarning =
      contentComponent && disabled && (errorKey || errorMessage);

    const hideTitle =
      (currentTransaction.type === TRANSACTION_TYPES.CONTRACT_INTERACTION ||
        currentTransaction.type === TRANSACTION_TYPES.DEPLOY_CONTRACT) &&
      currentTransaction.txParams?.value === '0x0';

    return (
      <GasFeeContextProvider transaction={currentTransaction}>
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
            showAccountInHeader={showAccountInHeader}
            accountAddress={fromAddress}
          >
            {hideSenderToRecipient ? null : (
              <SenderToRecipient
                senderName={fromName}
                senderAddress={fromAddress}
                recipientName={toName}
                recipientAddress={toAddress}
                recipientEns={toEns}
                recipientNickname={toNickname}
              />
            )}
          </ConfirmPageContainerHeader>
          <div>
            {showAddToAddressDialog && (
              <>
                <Dialog
                  type="message"
                  className="send__dialog"
                  onClick={() => this.setState({ showNicknamePopovers: true })}
                >
                  {this.context.t('newAccountDetectedDialogMessage')}
                </Dialog>
                {this.state.showNicknamePopovers ? (
                  <NicknamePopovers
                    onClose={() =>
                      this.setState({ showNicknamePopovers: false })
                    }
                    address={toAddress}
                  />
                ) : null}
              </>
            )}
          </div>
          {contentComponent || (
            <ConfirmPageContainerContent
              action={action}
              title={title}
              titleComponent={titleComponent}
              subtitleComponent={subtitleComponent}
              hideSubtitle={hideSubtitle}
              detailsComponent={detailsComponent}
              dataComponent={dataComponent}
              dataHexComponent={dataHexComponent}
              errorMessage={errorMessage}
              errorKey={errorKey}
              identiconAddress={identiconAddress}
              nonce={nonce}
              warning={warning}
              onCancelAll={onCancelAll}
              onCancel={onCancel}
              cancelText={this.context.t('reject')}
              onSubmit={onSubmit}
              submitText={this.context.t('confirm')}
              disabled={disabled}
              unapprovedTxCount={unapprovedTxCount}
              rejectNText={this.context.t('rejectTxsN', [unapprovedTxCount])}
              origin={origin}
              ethGasPriceWarning={ethGasPriceWarning}
              hideTitle={hideTitle}
              supportsEIP1559V2={supportsEIP1559V2}
            />
          )}
          {shouldDisplayWarning && (
            <div className="confirm-approve-content__warning">
              <ErrorMessage errorKey={errorKey} />
            </div>
          )}
          {contentComponent && (
            <PageContainerFooter
              onCancel={onCancel}
              cancelText={this.context.t('reject')}
              onSubmit={onSubmit}
              submitText={this.context.t('confirm')}
              disabled={disabled}
            >
              {unapprovedTxCount > 1 && (
                <a onClick={onCancelAll}>
                  {this.context.t('rejectTxsN', [unapprovedTxCount])}
                </a>
              )}
            </PageContainerFooter>
          )}
          {editingGas && !supportsEIP1559V2 && (
            <EditGasPopover
              mode={EDIT_GAS_MODES.MODIFY_IN_PLACE}
              onClose={handleCloseEditGas}
              transaction={currentTransaction}
            />
          )}
          {supportsEIP1559V2 && (
            <>
              <EditGasFeePopover />
              <AdvancedGasFeePopover />
            </>
          )}
        </div>
      </GasFeeContextProvider>
    );
  }
}
