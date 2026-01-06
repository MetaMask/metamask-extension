import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import copyToClipboard from 'copy-to-clipboard';
import { getBlockExplorerLink } from '@metamask/etherscan-link';
import { TransactionType } from '@metamask/transaction-controller';
import { Button, ButtonSize } from '@metamask/design-system-react';
import SenderToRecipient from '../../ui/sender-to-recipient';
import { DEFAULT_VARIANT } from '../../ui/sender-to-recipient/sender-to-recipient.constants';
import Disclosure from '../../ui/disclosure';
import TransactionActivityLog from '../transaction-activity-log';
import TransactionBreakdown from '../transaction-breakdown';
import Tooltip from '../../ui/tooltip';
import CancelButton from '../cancel-button';
import Popover from '../../ui/popover';
import { Box } from '../../component-library/box';
import { SECOND } from '../../../../shared/constants/time';
import { MetaMetricsEventCategory } from '../../../../shared/constants/metametrics';
import { getURLHostName } from '../../../helpers/utils/util';
import { NETWORKS_ROUTE } from '../../../helpers/constants/routes';
import { COPY_OPTIONS } from '../../../../shared/constants/copy';
import { CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP } from '../../../../shared/constants/network';

export default class TransactionListItemDetails extends PureComponent {
  static contextTypes = {
    t: PropTypes.func,
    trackEvent: PropTypes.func,
  };

  static defaultProps = {};

  static propTypes = {
    onCancel: PropTypes.func,
    onRetry: PropTypes.func,
    showCancel: PropTypes.bool,
    showSpeedUp: PropTypes.bool,
    /**
     * Disabling the retry button until further notice
     *
     * @see {@link https://github.com/MetaMask/metamask-extension/issues/28615}
     */
    // showRetry: PropTypes.bool,
    isEarliestNonce: PropTypes.bool,
    primaryCurrency: PropTypes.string,
    transactionGroup: PropTypes.object,
    title: PropTypes.string.isRequired,
    onClose: PropTypes.func.isRequired,
    recipientAddress: PropTypes.string,
    recipientName: PropTypes.string,
    senderAddress: PropTypes.string.isRequired,
    tryReverseResolveAddress: PropTypes.func.isRequired,
    senderNickname: PropTypes.string.isRequired,
    transactionStatus: PropTypes.func,
    isCustomNetwork: PropTypes.bool,
    navigate: PropTypes.func.isRequired,
    blockExplorerLinkText: PropTypes.object,
    chainId: PropTypes.string,
    networkConfiguration: PropTypes.object,
  };

  state = {
    justCopied: false,
  };

  handleBlockExplorerClick = () => {
    const {
      transactionGroup: { primaryTransaction },
      networkConfiguration,
      isCustomNetwork,
      navigate,
      onClose,
      chainId,
    } = this.props;
    const blockExplorerUrl =
      networkConfiguration?.[chainId]?.blockExplorerUrls[
        networkConfiguration?.[chainId]?.defaultBlockExplorerUrlIndex
      ];

    const rpcPrefs = {
      blockExplorerUrl,
      imageUrl: CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP[chainId],
    };

    const blockExplorerLink = getBlockExplorerLink(
      primaryTransaction,
      rpcPrefs,
    );

    if (!rpcPrefs.blockExplorerUrl && isCustomNetwork) {
      onClose();
      navigate(`${NETWORKS_ROUTE}#blockExplorerUrl`);
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
    const { recipientAddress, tryReverseResolveAddress } = this.props;

    if (recipientAddress) {
      tryReverseResolveAddress(recipientAddress);
    }
  }

  render() {
    const { t } = this.context;
    const { justCopied } = this.state;
    const {
      transactionGroup,
      primaryCurrency,
      showSpeedUp,
      // showRetry,
      recipientAddress,
      recipientName,
      senderAddress,
      isEarliestNonce,
      senderNickname,
      title,
      onClose,
      showCancel,
      transactionStatus: TransactionStatus,
      blockExplorerLinkText,
    } = this.props;
    const {
      primaryTransaction: transaction,
      initialTransaction: { type },
    } = transactionGroup;
    const { chainId, hash } = transaction;

    return (
      <Popover title={title} onClose={onClose}>
        <div className="transaction-list-item-details">
          <div className="transaction-list-item-details__operations">
            <div className="flex gap-2">
              {showSpeedUp && (
                <Button
                  size={ButtonSize.Sm}
                  onClick={this.handleRetry}
                  data-testid="speedup-button"
                >
                  {t('speedUp')}
                </Button>
              )}
              {showCancel && (
                <CancelButton
                  size={ButtonSize.Sm}
                  transaction={transaction}
                  cancelTransaction={this.handleCancel}
                  detailsModal
                />
              )}
              {/* {showRetry && (
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
              )} */}
            </div>
          </div>
          <div className="transaction-list-item-details__header">
            <div
              className="transaction-list-item-details__tx-status gap-1 h-auto"
              data-testid="transaction-list-item-details-tx-status"
            >
              <div>{t('status')}</div>
              <div>
                <TransactionStatus />
              </div>
            </div>
            <div className="transaction-list-item-details__tx-hash gap-1">
              <button
                type="button"
                className="text-primary-default"
                onClick={this.handleBlockExplorerClick}
                disabled={!hash}
              >
                {blockExplorerLinkText.firstPart === 'addBlockExplorer'
                  ? t('addBlockExplorer')
                  : t('viewOnBlockExplorer')}
              </button>

              <Tooltip
                wrapperClassName="transaction-list-item-details__header-button"
                containerClassName="transaction-list-item-details__header-button-tooltip-container"
                title={justCopied ? t('copiedExclamation') : null}
              >
                <button
                  type="button"
                  className="text-primary-default"
                  onClick={this.handleCopyTxId}
                  disabled={!hash}
                >
                  {t('copyTransactionId')}
                </button>
              </Tooltip>
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
                recipientAddress={recipientAddress}
                recipientName={recipientName}
                senderName={senderNickname}
                senderAddress={senderAddress}
                chainId={chainId}
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
                chainId={chainId}
              />
              {transactionGroup.initialTransaction.type !==
                TransactionType.incoming && (
                <Box marginTop={3} marginBottom={3}>
                  <Disclosure
                    title={t('activityLog')}
                    size="small"
                    isScrollToBottomOnOpen
                  >
                    <TransactionActivityLog
                      transactionGroup={transactionGroup}
                      className="transaction-list-item-details__transaction-activity-log"
                      onCancel={this.handleCancel}
                      onRetry={this.handleRetry}
                      isEarliestNonce={isEarliestNonce}
                    />
                  </Disclosure>
                </Box>
              )}
            </div>
          </div>
        </div>
      </Popover>
    );
  }
}
