import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import copyToClipboard from 'copy-to-clipboard';
import { getBlockExplorerLink } from '@metamask/etherscan-link';
import { TransactionType } from '@metamask/transaction-controller';
import {
  BannerAlert,
  BannerAlertSeverity,
  Button,
  ButtonSize,
  Text,
  TextVariant,
} from '@metamask/design-system-react';
import SenderToRecipient from '../../ui/sender-to-recipient';
import { DEFAULT_VARIANT } from '../../ui/sender-to-recipient/sender-to-recipient.constants';
import TransactionBreakdown from '../transaction-breakdown';
import TransactionStatusLabel from '../transaction-status-label/transaction-status-label';
import Tooltip from '../../ui/tooltip';
import CancelButton from '../cancel-button';
import Popover from '../../ui/popover';
import { SECOND } from '../../../../shared/constants/time';
import { MetaMetricsEventCategory } from '../../../../shared/constants/metametrics';
import { getURLHostName } from '../../../helpers/utils/util';
import { NETWORKS_ROUTE } from '../../../helpers/constants/routes';
import { COPY_OPTIONS } from '../../../../shared/constants/copy';
import { CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP } from '../../../../shared/constants/network';
import { useI18nContext } from '../../../hooks/useI18nContext';

function TransactionListItemDetails({
  trackEvent,
  onCancel,
  onRetry,
  showCancel,
  showSpeedUp,
  primaryCurrency,
  transactionGroup,
  title,
  onClose,
  recipientAddress,
  senderAddress,
  tryReverseResolveAddress,
  senderNickname,
  transactionStatus: TransactionStatus,
  isCustomNetwork,
  navigate,
  blockExplorerLinkText,
  networkConfiguration,
  isHardwareWalletAccount,
  isProtectedByEnforcedSimulations,
}) {
  const t = useI18nContext();
  const [justCopied, setJustCopied] = useState(false);
  const copyTimeoutRef = useRef(null);

  const {
    primaryTransaction,
    initialTransaction: { type },
    hasCancelled,
  } = transactionGroup;
  const { chainId, hash: txHash } = primaryTransaction;
  const speedUpLabel = hasCancelled ? 'speedUpCancellation' : 'speedUp';

  useEffect(() => {
    if (recipientAddress) {
      tryReverseResolveAddress(recipientAddress);
    }
  }, [recipientAddress, tryReverseResolveAddress]);

  useEffect(
    () => () => {
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
    },
    [],
  );

  const handleBlockExplorerClick = useCallback(() => {
    const { primaryTransaction: primaryTx } = transactionGroup;
    const blockExplorerUrl =
      networkConfiguration?.[chainId]?.blockExplorerUrls[
        networkConfiguration?.[chainId]?.defaultBlockExplorerUrlIndex
      ];

    const rpcPrefs = {
      blockExplorerUrl,
      imageUrl: CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP[chainId],
    };

    const blockExplorerLink = getBlockExplorerLink(
      primaryTx,
      rpcPrefs,
    );

    if (!rpcPrefs.blockExplorerUrl && isCustomNetwork) {
      onClose();
      navigate(`${NETWORKS_ROUTE}#blockExplorerUrl`);
    } else {
      trackEvent({
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
  }, [
    chainId,
    isCustomNetwork,
    navigate,
    networkConfiguration,
    onClose,
    trackEvent,
    transactionGroup,
  ]);

  const handleCancel = useCallback(
    (event) => {
      onCancel(event);
      onClose();
    },
    [onCancel, onClose],
  );

  const handleRetry = useCallback(
    (event) => {
      onRetry(event);
      onClose();
    },
    [onClose, onRetry],
  );

  const handleCopyTxId = useCallback(() => {
    trackEvent({
      category: MetaMetricsEventCategory.Navigation,
      event: 'Copied Transaction ID',
      properties: {
        action: 'Activity Log',
        legacy_event: true,
      },
    });

    setJustCopied(true);
    copyToClipboard(txHash, COPY_OPTIONS);
    copyTimeoutRef.current = setTimeout(() => setJustCopied(false), SECOND);
  }, [trackEvent, txHash]);

  return (
    <Popover title={title} onClose={onClose}>
      <div className="transaction-list-item-details">
        {isProtectedByEnforcedSimulations && (
          <BannerAlert
            severity={BannerAlertSeverity.Info}
            className="mx-4"
            data-testid="transaction-protected-by-enforced-simulations"
          >
            <Text variant={TextVariant.BodySm}>
              {t('transactionProtectedByEnforcedSimulations')}
            </Text>
          </BannerAlert>
        )}
        <div className="transaction-list-item-details__operations">
          <div className="flex gap-2">
            {showSpeedUp && (
              <Button
                size={ButtonSize.Sm}
                onClick={handleRetry}
                data-testid="speedup-button"
              >
                {t(speedUpLabel)}
              </Button>
            )}
            {showCancel && (
              <CancelButton
                size={ButtonSize.Sm}
                cancelTransaction={handleCancel}
              />
            )}
          </div>
        </div>
        <div className="transaction-list-item-details__header">
          <div
            className="transaction-list-item-details__tx-status gap-1 h-auto"
            data-testid="transaction-list-item-details-tx-status"
          >
            <div>{t('status')}</div>
            <div>
              {isProtectedByEnforcedSimulations ? (
                <TransactionStatusLabel
                  label={t('cancelled')}
                  tooltip={t('transactionProtectedByEnforcedSimulations')}
                />
              ) : (
                <TransactionStatus />
              )}
            </div>
          </div>
          <div className="transaction-list-item-details__tx-hash gap-1">
            <button
              type="button"
              className="text-primary-default"
              onClick={handleBlockExplorerClick}
              disabled={!txHash}
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
                onClick={handleCopyTxId}
                disabled={!txHash}
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
              senderName={senderNickname}
              senderAddress={senderAddress}
              chainId={chainId}
            />
          </div>
          <div className="transaction-list-item-details__cards-container">
            <TransactionBreakdown
              isHardwareWalletAccount={isHardwareWalletAccount}
              nonce={transactionGroup.initialTransaction.txParams.nonce}
              isTokenApprove={
                type === TransactionType.tokenMethodApprove ||
                type === TransactionType.tokenMethodSetApprovalForAll
              }
              transaction={primaryTransaction}
              primaryCurrency={primaryCurrency}
              className="transaction-list-item-details__transaction-breakdown"
              chainId={chainId}
            />
          </div>
        </div>
      </div>
    </Popover>
  );
}

TransactionListItemDetails.propTypes = {
  trackEvent: PropTypes.func.isRequired,
  onCancel: PropTypes.func,
  onRetry: PropTypes.func,
  showCancel: PropTypes.bool,
  showSpeedUp: PropTypes.bool,
  primaryCurrency: PropTypes.string,
  transactionGroup: PropTypes.object,
  title: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
  recipientAddress: PropTypes.string,
  senderAddress: PropTypes.string.isRequired,
  tryReverseResolveAddress: PropTypes.func.isRequired,
  senderNickname: PropTypes.string.isRequired,
  transactionStatus: PropTypes.func,
  isCustomNetwork: PropTypes.bool,
  navigate: PropTypes.func.isRequired,
  blockExplorerLinkText: PropTypes.object,
  chainId: PropTypes.string,
  networkConfiguration: PropTypes.object,
  isHardwareWalletAccount: PropTypes.bool,
  isProtectedByEnforcedSimulations: PropTypes.bool,
};

export default memo(TransactionListItemDetails);
