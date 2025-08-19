/* eslint-disable import/no-duplicates */
import React, { useMemo, useState, useCallback, useContext } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { useHistory } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';

import {
  CHAIN_IDS,
  TransactionStatus,
  TransactionType,
} from '@metamask/transaction-controller';
import { useTransactionDisplayData } from '../../../hooks/useTransactionDisplayData';
import { useI18nContext } from '../../../hooks/useI18nContext';
import CancelSpeedupPopover from '../cancel-speedup-popover';
import TransactionListItemDetails from '../transaction-list-item-details';
import { CONFIRM_TRANSACTION_ROUTE } from '../../../helpers/constants/routes';
import { useShouldShowSpeedUp } from '../../../hooks/useShouldShowSpeedUp';
import TransactionStatusLabel from '../transaction-status-label/transaction-status-label';
import TransactionIcon from '../transaction-icon';
import {
  BackgroundColor,
  Color,
  Display,
  FontWeight,
  TextAlign,
  TextVariant,
  FlexDirection,
  AlignItems,
} from '../../../helpers/constants/design-system';
import {
  AvatarNetwork,
  AvatarNetworkSize,
  BadgeWrapper,
  BadgeWrapperAnchorElementShape,
  Box,
  Text,
} from '../../component-library';

import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import { TransactionGroupCategory } from '../../../../shared/constants/transaction';
import { EditGasModes } from '../../../../shared/constants/gas';
import {
  GasFeeContextProvider,
  useGasFeeContext,
} from '../../../contexts/gasFee';
import {
  TransactionModalContextProvider,
  useTransactionModalContext,
} from '../../../contexts/transaction-modal';
import {
  accountSupportsCancelSpeedup,
  checkNetworkAndAccountSupports1559,
} from '../../../selectors';
import { isLegacyTransaction } from '../../../helpers/utils/transactions.util';
import { formatDateWithYearContext } from '../../../helpers/utils/util';
import Button from '../../ui/button';
import AdvancedGasFeePopover from '../../../pages/confirmations/components/advanced-gas-fee-popover';
import CancelButton from '../cancel-button';
import EditGasFeePopover from '../../../pages/confirmations/components/edit-gas-fee-popover';
import EditGasPopover from '../../../pages/confirmations/components/edit-gas-popover';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import { ActivityListItem } from '../../multichain';
import { abortTransactionSigning } from '../../../store/actions';
import {
  useBridgeTxHistoryData,
  FINAL_NON_CONFIRMED_STATUSES,
} from '../../../hooks/bridge/useBridgeTxHistoryData';
import BridgeActivityItemTxSegments from '../../../pages/bridge/transaction-details/bridge-activity-item-tx-segments';
import {
  CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP,
  NETWORK_TO_NAME_MAP,
} from '../../../../shared/constants/network';

function TransactionListItemInner({
  transactionGroup,
  setEditGasMode,
  isEarliestNonce = false,
  chainId,
}) {
  const t = useI18nContext();
  const history = useHistory();
  const { hasCancelled } = transactionGroup;
  const [showDetails, setShowDetails] = useState(false);
  const [showCancelEditGasPopover, setShowCancelEditGasPopover] =
    useState(false);
  const [showRetryEditGasPopover, setShowRetryEditGasPopover] = useState(false);
  const { supportsEIP1559 } = useGasFeeContext();
  const { openModal } = useTransactionModalContext();
  const dispatch = useDispatch();

  // Bridge transactions
  const isBridgeTx =
    transactionGroup.initialTransaction.type === TransactionType.bridge;
  const {
    bridgeTxHistoryItem,
    isBridgeComplete,
    showBridgeTxDetails,
    isBridgeFailed,
  } = useBridgeTxHistoryData({
    transactionGroup,
    isEarliestNonce,
  });
  const isUnifiedSwapTx =
    (isBridgeTx ||
      transactionGroup.initialTransaction.type === TransactionType.swap) &&
    bridgeTxHistoryItem;

  const getTestNetworkBackgroundColor = (networkId) => {
    switch (true) {
      case networkId === CHAIN_IDS.GOERLI:
        return BackgroundColor.goerli;
      case networkId === CHAIN_IDS.SEPOLIA:
        return BackgroundColor.sepolia;
      default:
        return undefined;
    }
  };

  const {
    initialTransaction: { id },
    primaryTransaction: { error, status },
  } = transactionGroup;

  const trackEvent = useContext(MetaMetricsContext);

  const retryTransaction = useCallback(
    async (event) => {
      event.stopPropagation();
      trackEvent({
        event: 'Clicked "Speed Up"',
        category: MetaMetricsEventCategory.Navigation,
        properties: {
          action: 'Activity Log',
          legacy_event: true,
        },
      });
      if (supportsEIP1559) {
        setEditGasMode(EditGasModes.speedUp);
        openModal('cancelSpeedUpTransaction');
      } else {
        setShowRetryEditGasPopover(true);
      }
    },
    [openModal, setEditGasMode, trackEvent, supportsEIP1559],
  );

  const cancelTransaction = useCallback(
    (event) => {
      event.stopPropagation();
      trackEvent({
        event: 'Clicked "Cancel"',
        category: MetaMetricsEventCategory.Navigation,
        properties: {
          action: 'Activity Log',
          legacy_event: true,
        },
      });
      if (status === TransactionStatus.approved) {
        dispatch(abortTransactionSigning(id));
      } else if (supportsEIP1559) {
        setEditGasMode(EditGasModes.cancel);
        openModal('cancelSpeedUpTransaction');
      } else {
        setShowCancelEditGasPopover(true);
      }
    },
    [
      trackEvent,
      openModal,
      setEditGasMode,
      supportsEIP1559,
      status,
      dispatch,
      id,
    ],
  );

  const shouldShowSpeedUp = useShouldShowSpeedUp(
    transactionGroup,
    isEarliestNonce,
  );

  const {
    title,
    category,
    primaryCurrency,
    recipientAddress,
    secondaryCurrency,
    displayedStatusKey: displayedStatusKeyFromSrcTransaction,
    isPending,
    senderAddress,
    detailsTitle,
    remoteSignerAddress,
  } = useTransactionDisplayData(transactionGroup);
  const displayedStatusKey =
    isBridgeTx && isBridgeFailed
      ? TransactionStatus.failed
      : displayedStatusKeyFromSrcTransaction;
  const date = formatDateWithYearContext(
    transactionGroup.primaryTransaction.time,
    'MMM d, y',
    'MMM d',
  );
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

  const isSigning = status === TransactionStatus.approved;
  const isSubmitting = status === TransactionStatus.signed;

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
      history.push(`${CONFIRM_TRANSACTION_ROUTE}/${id}`);
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
  }, [isUnapproved, history, id, trackEvent, category]);

  const supportsCancelSpeedup = useSelector(accountSupportsCancelSpeedup);

  const speedUpButton = useMemo(() => {
    if (
      !shouldShowSpeedUp ||
      !isPending ||
      isUnapproved ||
      isSigning ||
      isSubmitting ||
      !supportsCancelSpeedup
    ) {
      return null;
    }

    return (
      <Button
        data-testid="speed-up-button"
        type="primary"
        onClick={hasCancelled ? cancelTransaction : retryTransaction}
        style={hasCancelled ? { width: 'auto' } : null}
      >
        {hasCancelled ? t('speedUpCancellation') : t('speedUp')}
      </Button>
    );
  }, [
    shouldShowSpeedUp,
    isUnapproved,
    t,
    isPending,
    isSigning,
    isSubmitting,
    hasCancelled,
    retryTransaction,
    cancelTransaction,
    supportsCancelSpeedup,
  ]);

  const showCancelButton =
    !hasCancelled &&
    isPending &&
    !isUnapproved &&
    !isSubmitting &&
    !isBridgeTx &&
    supportsCancelSpeedup;

  return (
    <>
      <ActivityListItem
        data-testid="activity-list-item"
        onClick={
          isUnifiedSwapTx && showBridgeTxDetails
            ? showBridgeTxDetails
            : toggleShowDetails
        }
        className={className}
        title={title}
        icon={
          <BadgeWrapper
            anchorElementShape={BadgeWrapperAnchorElementShape.circular}
            display={Display.Block}
            badge={
              <AvatarNetwork
                className="activity-tx__network-badge"
                data-testid="activity-tx-network-badge"
                size={AvatarNetworkSize.Xs}
                name={NETWORK_TO_NAME_MAP[chainId]}
                src={CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP[chainId]}
                borderColor={BackgroundColor.backgroundDefault}
                backgroundColor={getTestNetworkBackgroundColor(chainId)}
              />
            }
          >
            <TransactionIcon category={category} status={displayedStatusKey} />
          </BadgeWrapper>
        }
        subtitle={
          !FINAL_NON_CONFIRMED_STATUSES.includes(status) &&
          isBridgeTx &&
          !(isBridgeComplete || isBridgeFailed) &&
          bridgeTxHistoryItem ? (
            <BridgeActivityItemTxSegments
              bridgeTxHistoryItem={bridgeTxHistoryItem}
              transactionGroup={transactionGroup}
            />
          ) : (
            <TransactionStatusLabel
              statusOnly
              isPending={isPending}
              isEarliestNonce={isEarliestNonce}
              error={error}
              date={date}
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
                  variant={TextVariant.bodyLgMedium}
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
                variant={TextVariant.bodyMd}
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
        {Boolean(showCancelButton || speedUpButton) && (
          <Box
            paddingTop={4}
            className="transaction-list-item__pending-actions"
          >
            {showCancelButton && (
              <CancelButton
                data-testid="cancel-button"
                transaction={transactionGroup.primaryTransaction}
                cancelTransaction={cancelTransaction}
              />
            )}
            {speedUpButton}
          </Box>
        )}
      </ActivityListItem>
      {showDetails && (
        <TransactionListItemDetails
          title={detailsTitle}
          onClose={toggleShowDetails}
          transactionGroup={transactionGroup}
          primaryCurrency={primaryCurrency}
          senderAddress={senderAddress}
          recipientAddress={recipientAddress}
          onRetry={retryTransaction}
          // showRetry={showRetry}
          showSpeedUp={shouldShowSpeedUp}
          isEarliestNonce={isEarliestNonce}
          onCancel={cancelTransaction}
          transactionStatus={() => (
            <TransactionStatusLabel
              isPending={isPending}
              isEarliestNonce={isEarliestNonce}
              error={error}
              date={date}
              status={displayedStatusKey}
              statusOnly
            />
          )}
          chainId={chainId}
          remoteSignerAddress={remoteSignerAddress}
        />
      )}
      {!supportsEIP1559 && showRetryEditGasPopover && (
        <EditGasPopover
          onClose={() => setShowRetryEditGasPopover(false)}
          mode={EditGasModes.speedUp}
          transaction={transactionGroup.primaryTransaction}
        />
      )}
      {!supportsEIP1559 && showCancelEditGasPopover && (
        <EditGasPopover
          onClose={() => setShowCancelEditGasPopover(false)}
          mode={EditGasModes.cancel}
          transaction={transactionGroup.primaryTransaction}
        />
      )}
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

  const supportsEIP1559 =
    useSelector(checkNetworkAndAccountSupports1559) &&
    !isLegacyTransaction(transaction?.txParams);

  return (
    <GasFeeContextProvider
      transaction={transactionGroup.primaryTransaction}
      editGasMode={editGasMode}
    >
      <TransactionModalContextProvider>
        <TransactionListItemInner {...props} setEditGasMode={setEditGasMode} />
        {supportsEIP1559 && (
          <>
            <CancelSpeedupPopover />
            <EditGasFeePopover />
            <AdvancedGasFeePopover />
          </>
        )}
      </TransactionModalContextProvider>
    </GasFeeContextProvider>
  );
};

TransactionListItem.propTypes = {
  transactionGroup: PropTypes.object.isRequired,
};

export default TransactionListItem;
