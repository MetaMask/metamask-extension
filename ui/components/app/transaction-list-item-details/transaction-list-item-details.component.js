import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import copyToClipboard from 'copy-to-clipboard';
import { getBlockExplorerLink } from '@metamask/etherscan-link';
import { TransactionType } from '@metamask/transaction-controller';
import SenderToRecipient from '../../ui/sender-to-recipient';
import { DEFAULT_VARIANT } from '../../ui/sender-to-recipient/sender-to-recipient.constants';
import Disclosure from '../../ui/disclosure';
import TransactionActivityLog from '../transaction-activity-log';
import TransactionBreakdown from '../transaction-breakdown';
import Button from '../../ui/button';
import Tooltip from '../../ui/tooltip';
import CancelButton from '../cancel-button';
import Popover from '../../ui/popover';
///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
import { Box, Icon, IconName, Text } from '../../component-library';
import { IconColor } from '../../../helpers/constants/design-system';
///: END:ONLY_INCLUDE_IF
import { SECOND } from '../../../../shared/constants/time';
import { MetaMetricsEventCategory } from '../../../../shared/constants/metametrics';
import { getURLHostName } from '../../../helpers/utils/util';
import { NETWORKS_ROUTE } from '../../../helpers/constants/routes';
import { COPY_OPTIONS } from '../../../../shared/constants/copy';

export default class TransactionListItemDetails extends PureComponent {
  static contextTypes = {
    t: PropTypes.func,
    trackEvent: PropTypes.func,
  };

  static defaultProps = {
    recipientEns: null,
  };

  static propTypes = {
    onCancel: PropTypes.func,
    onRetry: PropTypes.func,
    showCancel: PropTypes.bool,
    showSpeedUp: PropTypes.bool,
    showRetry: PropTypes.bool,
    isEarliestNonce: PropTypes.bool,
    primaryCurrency: PropTypes.string,
    transactionGroup: PropTypes.object,
    title: PropTypes.string.isRequired,
    onClose: PropTypes.func.isRequired,
    recipientEns: PropTypes.string,
    recipientAddress: PropTypes.string,
    recipientName: PropTypes.string,
    recipientMetadataName: PropTypes.string,
    rpcPrefs: PropTypes.object,
    senderAddress: PropTypes.string.isRequired,
    tryReverseResolveAddress: PropTypes.func.isRequired,
    senderNickname: PropTypes.string.isRequired,
    recipientNickname: PropTypes.string,
    transactionStatus: PropTypes.func,
    isCustomNetwork: PropTypes.bool,
    history: PropTypes.object,
    blockExplorerLinkText: PropTypes.object,
    ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
    getCustodianTransactionDeepLink: PropTypes.func,
    selectedIdentity: PropTypes.object,
    transactionNote: PropTypes.string,
    ///: END:ONLY_INCLUDE_IF
  };

  state = {
    justCopied: false,
    ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
    custodyTransactionDeepLink: null,
    ///: END:ONLY_INCLUDE_IF
  };

  handleBlockExplorerClick = () => {
    const {
      transactionGroup: { primaryTransaction },
      rpcPrefs,
      isCustomNetwork,
      history,
      onClose,
    } = this.props;
    const blockExplorerLink = getBlockExplorerLink(
      primaryTransaction,
      rpcPrefs,
    );

    if (!rpcPrefs.blockExplorerUrl && isCustomNetwork) {
      onClose();
      history.push(`${NETWORKS_ROUTE}#blockExplorerUrl`);
    } else {
      this.context.trackEvent({
        category: MetaMetricsEventCategory.Transactions,
        event: 'Clicked Block Explorer Link',
        properties: {
          link_type: 'Transaction Block Explorer',
          action: 'Transaction Details',
          block_explorer_domain: getURLHostName(blockExplorerLink),
        },
      });

      global.platform.openTab({
        url: blockExplorerLink,
      });
    }
  };

  handleCancel = (event) => {
    const { onCancel, onClose } = this.props;
    onCancel(event);
    onClose();
  };

  handleRetry = (event) => {
    const { onClose, onRetry } = this.props;
    onRetry(event);
    onClose();
  };

  handleCopyTxId = () => {
    const { transactionGroup } = this.props;
    const { primaryTransaction: transaction } = transactionGroup;
    const { hash } = transaction;

    this.context.trackEvent({
      category: MetaMetricsEventCategory.Navigation,
      event: 'Copied Transaction ID',
      properties: {
        action: 'Activity Log',
        legacy_event: true,
      },
    });

    this.setState({ justCopied: true }, () => {
      copyToClipboard(hash, COPY_OPTIONS);
      setTimeout(() => this.setState({ justCopied: false }), SECOND);
    });
  };

  componentDidMount() {
    const {
      recipientAddress,
      tryReverseResolveAddress,
      ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
      selectedIdentity,
      transactionGroup,
      ///: END:ONLY_INCLUDE_IF
    } = this.props;

    ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
    this._mounted = true;
    const address = selectedIdentity?.address;
    const custodyId = transactionGroup?.primaryTransaction?.custodyId;

    if (this._mounted && address && custodyId) {
      this.getCustodianTransactionDeepLink(address, custodyId);
    }
    ///: END:ONLY_INCLUDE_IF

    if (recipientAddress) {
      tryReverseResolveAddress(recipientAddress);
    }
  }

  ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
  getCustodianTransactionDeepLink = async (address, custodyId) => {
    const { getCustodianTransactionDeepLink } = this.props;

    const custodyTransactionDeepLink = await getCustodianTransactionDeepLink(
      address,
      custodyId,
    );

    if (custodyTransactionDeepLink && this._mounted) {
      this.setState({ custodyTransactionDeepLink });
    }
  };

  componentWillUnmount() {
    this._mounted = false;
  }
  ///: END:ONLY_INCLUDE_IF

  render() {
    const { t } = this.context;
    const {
      justCopied,
      ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
      custodyTransactionDeepLink,
      ///: END:ONLY_INCLUDE_IF
    } = this.state;
    const {
      transactionGroup,
      primaryCurrency,
      showSpeedUp,
      showRetry,
      recipientEns,
      recipientAddress,
      recipientName,
      recipientMetadataName,
      senderAddress,
      isEarliestNonce,
      senderNickname,
      title,
      onClose,
      recipientNickname,
      showCancel,
      transactionStatus: TransactionStatus,
      blockExplorerLinkText,
      ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
      transactionNote,
      ///: END:ONLY_INCLUDE_IF
    } = this.props;
    const {
      primaryTransaction: transaction,
      initialTransaction: { type },
    } = transactionGroup;
    const { hash } = transaction;

    return (
      <Popover title={title} onClose={onClose}>
        <div className="transaction-list-item-details">
          <div className="transaction-list-item-details__operations">
            <div className="transaction-list-item-details__header-buttons">
              {showSpeedUp && (
                <Button
                  type="primary"
                  onClick={this.handleRetry}
                  className="transaction-list-item-details__header-button-rounded-button"
                  data-testid="speedup-button"
                >
                  {t('speedUp')}
                </Button>
              )}
              {showCancel && (
                <CancelButton
                  transaction={transaction}
                  cancelTransaction={this.handleCancel}
                  detailsModal
                />
              )}
              {showRetry && (
                <Tooltip title={t('retryTransaction')}>
                  <Button
                    type="raised"
                    onClick={this.handleRetry}
                    className="transaction-list-item-details__header-button"
                    data-testid="rety-button"
                  >
                    <i className="fa fa-sync"></i>
                  </Button>
                </Tooltip>
              )}
            </div>
          </div>
          <div className="transaction-list-item-details__header">
            <div
              className="transaction-list-item-details__tx-status"
              data-testid="transaction-list-item-details-tx-status"
            >
              <div>{t('status')}</div>
              <div>
                <TransactionStatus />
              </div>
            </div>
            <div className="transaction-list-item-details__tx-hash">
              <div>
                <Button
                  type="link"
                  onClick={this.handleBlockExplorerClick}
                  disabled={!hash}
                >
                  {blockExplorerLinkText.firstPart === 'addBlockExplorer'
                    ? t('addBlockExplorer')
                    : t('viewOnBlockExplorer')}
                </Button>
              </div>
              <div>
                <Tooltip
                  wrapperClassName="transaction-list-item-details__header-button"
                  containerClassName="transaction-list-item-details__header-button-tooltip-container"
                  title={justCopied ? t('copiedExclamation') : null}
                >
                  <Button
                    type="link"
                    onClick={this.handleCopyTxId}
                    disabled={!hash}
                  >
                    {t('copyTransactionId')}
                  </Button>
                </Tooltip>
              </div>
              {
                ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
                custodyTransactionDeepLink &&
                  custodyTransactionDeepLink.url && (
                    <Tooltip
                      wrapperClassName="transaction-list-item-details__header-button"
                      containerClassName="transaction-list-item-details__header-button-tooltip-container"
                      title={t('viewinCustodianApp')}
                    >
                      <Button
                        type="raised"
                        onClick={() => {
                          window.open(custodyTransactionDeepLink.url);
                        }}
                      >
                        <Icon
                          name={IconName.Custody}
                          color={IconColor.primaryDefault}
                        />
                      </Button>
                    </Tooltip>
                  )
                ///: END:ONLY_INCLUDE_IF
              }
            </div>
          </div>
          <div className="transaction-list-item-details__body">
            <div className="transaction-list-item-details__sender-to-recipient-header">
              <div>{t('from')}</div>
              <div>{t('to')}</div>
            </div>
            <div className="transaction-list-item-details__sender-to-recipient-container">
              <SenderToRecipient
                warnUserOnAccountMismatch={false}
                variant={DEFAULT_VARIANT}
                addressOnly
                recipientEns={recipientEns}
                recipientAddress={recipientAddress}
                recipientNickname={recipientNickname}
                recipientName={recipientName}
                recipientMetadataName={recipientMetadataName}
                senderName={senderNickname}
                senderAddress={senderAddress}
                onRecipientClick={() => {
                  this.context.trackEvent({
                    category: MetaMetricsEventCategory.Navigation,
                    event: 'Copied "To" Address',
                    properties: {
                      action: 'Activity Log',
                      legacy_event: true,
                    },
                  });
                }}
                onSenderClick={() => {
                  this.context.trackEvent({
                    category: MetaMetricsEventCategory.Navigation,
                    event: 'Copied "From" Address',
                    properties: {
                      action: 'Activity Log',
                      legacy_event: true,
                    },
                  });
                }}
              />
            </div>
            <div className="transaction-list-item-details__cards-container">
              <TransactionBreakdown
                nonce={transactionGroup.initialTransaction.txParams.nonce}
                isTokenApprove={
                  type === TransactionType.tokenMethodApprove ||
                  type === TransactionType.tokenMethodSetApprovalForAll
                }
                transaction={transaction}
                primaryCurrency={primaryCurrency}
                className="transaction-list-item-details__transaction-breakdown"
              />
              {
                ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
                transactionNote && transactionNote.length !== 0 && (
                  <Box className="transaction-list-item-details__transaction-breakdown">
                    <Text as="h4" className="transaction-breakdown__title">
                      {t('transactionNote')}
                    </Text>
                    <Text as="p" className="transaction-breakdown__description">
                      {transactionNote}
                    </Text>
                  </Box>
                )
                ///: END:ONLY_INCLUDE_IF
              }
              {transactionGroup.initialTransaction.type !==
                TransactionType.incoming && (
                <Disclosure title={t('activityLog')} size="small">
                  <TransactionActivityLog
                    transactionGroup={transactionGroup}
                    className="transaction-list-item-details__transaction-activity-log"
                    onCancel={this.handleCancel}
                    onRetry={this.handleRetry}
                    isEarliestNonce={isEarliestNonce}
                  />
                </Disclosure>
              )}
            </div>
          </div>
        </div>
      </Popover>
    );
  }
}
