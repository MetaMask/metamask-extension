/* eslint-disable import-x/no-duplicates */
import React, { useState, useCallback, useContext } from 'react';
import PropTypes from 'prop-types';
import classnames from 'clsx';
import { useNavigate } from 'react-router-dom';

import {
  TransactionStatus,
  TransactionType,
} from '@metamask/transaction-controller';
import { useTransactionDisplayData } from '../../../hooks/useTransactionDisplayData';
import { usePendingTransactionActions } from '../../../hooks/usePendingTransactionActions';
import { isIntentBridgeActivity } from '../../../helpers/transactions/pending-transaction-actions';
import { CancelSpeedup } from '../../../pages/confirmations/cancel-speedup/cancel-speedup';
import TransactionListItemDetails from '../transaction-list-item-details';
import { TransactionDetailsModal } from '../../../pages/confirmations/components/activity';
import { CONFIRM_TRANSACTION_ROUTE } from '../../../helpers/constants/routes';
import TransactionStatusLabel from '../transaction-status-label/transaction-status-label';
import TransactionIcon from '../transaction-icon';
import {
  Color,
  Display,
  FontWeight,
  TextAlign,
  TextVariant,
  FlexDirection,
  AlignItems,
} from '../../../helpers/constants/design-system';
import { Box, Text } from '../../component-library';

import { getStatusKey } from '../../../helpers/utils/transactions.util';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import { TransactionGroupCategory } from '../../../../shared/constants/transaction';
import { TransactionModalContextProvider } from '../../../contexts/transaction-modal';
import { PendingTransactionActionButtons } from '../pending-transaction-action-buttons/pending-transaction-action-buttons';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import { ActivityListItem } from '../../multichain/activity-list-item';
import {
  useBridgeTxHistoryData,
  FINAL_NON_CONFIRMED_STATUSES,
} from '../../../hooks/bridge/useBridgeTxHistoryData';
import BridgeActivityItemTxSegments from '../../../pages/bridge/transaction-details/bridge-activity-item-tx-segments';
import { PAY_TRANSACTION_TYPES } from '../../../pages/confirmations/constants/pay';
import { ChainBadge } from '../chain-badge/chain-badge';
import {
  mapTransactionTypeToCategory,
  resolveTransactionType,
} from './helpers';

function TransactionListItemInner({
  transactionGroup,
  setEditGasMode,
  isEarliestNonce = false,
  chainId,
}) {
  const navigate = useNavigate();
  const [showDetails, setShowDetails] = useState(false);

  // Bridge transactions
  const isBridgeTx =
    transactionGroup.initialTransaction.type === TransactionType.bridge;
  const {
    bridgeHistoryItem,
    isBridgeComplete,
    showBridgeTxDetails,
    isBridgeFailed,
  } = useBridgeTxHistoryData({
    transactionGroup,
  });
  const isUnifiedSwapTx =
    (isBridgeTx ||
      transactionGroup.initialTransaction.type === TransactionType.swap) &&
    bridgeHistoryItem;

  const {
    initialTransaction: { id, txParams, type, metamaskPay },
    primaryTransaction: { error, status },
  } = transactionGroup;

  const badgeChainId =
    (type === TransactionType.perpsDeposit ||
      type === TransactionType.perpsWithdraw) &&
    metamaskPay?.chainId
      ? metamaskPay.chainId
      : chainId;

  const senderAddress = txParams?.from;

  const { trackEvent } = useContext(MetaMetricsContext);

  const {
    showCancel: showCancelButton,
    onCancel: cancelTransaction,
    speedUp,
  } = usePendingTransactionActions({
    transactionGroup,
    isEarliestNonce,
    setEditGasMode,
    hasIntentBridgeActivity: isIntentBridgeActivity(bridgeHistoryItem),
  });

  const resolvedType = resolveTransactionType(
    transactionGroup.initialTransaction.type,
    transactionGroup.initialTransaction.txParams?.to,
    transactionGroup.initialTransaction.txParams?.data,
  );

  const category = mapTransactionTypeToCategory(resolvedType);

  const {
    title,
    primaryCurrency,
    recipientAddress,
    secondaryCurrency,
    isPending,
  } = useTransactionDisplayData(transactionGroup);
  const displayedStatusKey =
    isBridgeTx && isBridgeFailed
      ? TransactionStatus.failed
      : getStatusKey(transactionGroup.primaryTransaction);
  const shouldShowPendingBridgeStatus =
    Boolean(isUnifiedSwapTx) &&
    displayedStatusKey === TransactionStatus.submitted &&
    !isBridgeFailed &&
    !isBridgeComplete;
  const isSignatureReq = category === TransactionGroupCategory.signatureRequest;
  const isApproval = category === TransactionGroupCategory.approval;
  const isUnapproved = status === TransactionStatus.unapproved;

  /**
   * Disabling the retry button until further notice
   *
   * @see {@link https://github.com/MetaMask/metamask-extension/issues/28615}
   */
  // const isSwap = [
  //   TransactionGroupCategory.swap,
  //   TransactionGroupCategory.swapAndSend,
  // ].includes(category);
  // const showRetry =
  //   status === TransactionStatus.failed && !isSwap && !isSmartTransaction;

  const className = classnames('transaction-list-item', {
    'transaction-list-item--unconfirmed':
      isPending ||
      [
        TransactionStatus.failed,
        TransactionStatus.dropped,
        TransactionStatus.rejected,
      ].includes(displayedStatusKey),
  });

  const toggleShowDetails = useCallback(() => {
    if (isUnapproved) {
      navigate(`${CONFIRM_TRANSACTION_ROUTE}/${id}`);
      return;
    }
    setShowDetails((prev) => {
      trackEvent({
        event: prev
          ? MetaMetricsEventName.ActivityDetailsClosed
          : MetaMetricsEventName.ActivityDetailsOpened,
        category: MetaMetricsEventCategory.Navigation,
        properties: {
          activity_type: category,
        },
      });
      return !prev;
    });
  }, [isUnapproved, navigate, id, trackEvent, category]);

  return (
    <>
      <ActivityListItem
        status={displayedStatusKey}
        onClick={
          isUnifiedSwapTx && showBridgeTxDetails
            ? showBridgeTxDetails
            : toggleShowDetails
        }
        className={className}
        title={title}
        icon={
          <ChainBadge chainId={badgeChainId}>
            <TransactionIcon category={category} status={displayedStatusKey} />
          </ChainBadge>
        }
        subtitle={
          !FINAL_NON_CONFIRMED_STATUSES.includes(status) &&
          isBridgeTx &&
          !(isBridgeComplete || isBridgeFailed) &&
          bridgeHistoryItem ? (
            <BridgeActivityItemTxSegments
              bridgeTxHistoryItem={bridgeHistoryItem}
              transactionGroup={transactionGroup}
            />
          ) : (
            <TransactionStatusLabel
              isPending={isPending}
              isEarliestNonce={isEarliestNonce || shouldShowPendingBridgeStatus}
              error={error}
              status={displayedStatusKey}
            />
          )
        }
        rightContent={
          !isSignatureReq &&
          !isApproval && (
            <>
              <Box
                display={Display.Flex}
                flexDirection={FlexDirection.Row}
                alignItems={AlignItems.center}
              >
                <Text
                  variant={TextVariant.bodyMdMedium}
                  fontWeight={FontWeight.Medium}
                  color={Color.textDefault}
                  title={primaryCurrency}
                  textAlign={TextAlign.Right}
                  data-testid="transaction-list-item-primary-currency"
                  className="activity-list-item__primary-currency"
                  ellipsis
                >
                  {primaryCurrency}
                </Text>
              </Box>
              <Text
                variant={TextVariant.bodySmMedium}
                color={Color.textAlternative}
                textAlign={TextAlign.Right}
                data-testid="transaction-list-item-secondary-currency"
              >
                {secondaryCurrency}
              </Text>
            </>
          )
        }
      >
        <PendingTransactionActionButtons
          showCancel={showCancelButton}
          onCancel={cancelTransaction}
          speedUp={speedUp}
          primaryTransaction={transactionGroup.primaryTransaction}
        />
      </ActivityListItem>
      {showDetails &&
        (PAY_TRANSACTION_TYPES.includes(resolvedType) ? (
          <TransactionDetailsModal
            transactionMeta={transactionGroup.initialTransaction}
            onClose={toggleShowDetails}
          />
        ) : (
          <TransactionListItemDetails
            title={title}
            onClose={toggleShowDetails}
            transactionGroup={transactionGroup}
            primaryCurrency={primaryCurrency}
            senderAddress={senderAddress}
            recipientAddress={recipientAddress}
            onRetry={speedUp.onClick}
            // showRetry={showRetry}
            showSpeedUp={speedUp.show}
            onCancel={cancelTransaction}
            transactionStatus={() => (
              <TransactionStatusLabel
                isPending={isPending}
                isEarliestNonce={
                  isEarliestNonce || shouldShowPendingBridgeStatus
                }
                error={error}
                status={displayedStatusKey}
              />
            )}
            chainId={chainId}
          />
        ))}
    </>
  );
}

TransactionListItemInner.propTypes = {
  transactionGroup: PropTypes.object.isRequired,
  isEarliestNonce: PropTypes.bool,
  setEditGasMode: PropTypes.func,
  chainId: PropTypes.string,
};

const TransactionListItem = (props) => {
  const { transactionGroup } = props;
  const [editGasMode, setEditGasMode] = useState();
  const transaction = transactionGroup.primaryTransaction;

  return (
    <TransactionModalContextProvider>
      <TransactionListItemInner {...props} setEditGasMode={setEditGasMode} />
      <CancelSpeedup transaction={transaction} editGasMode={editGasMode} />
    </TransactionModalContextProvider>
  );
};

TransactionListItem.propTypes = {
  transactionGroup: PropTypes.object.isRequired,
  isEarliestNonce: PropTypes.bool,
  chainId: PropTypes.string,
};

export default TransactionListItem;
