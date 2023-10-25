/* eslint-disable import/no-duplicates */
import React, { useMemo, useState, useCallback, useContext } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { useHistory } from 'react-router-dom';
import { useSelector } from 'react-redux';

import { useTransactionDisplayData } from '../../../hooks/useTransactionDisplayData';
import { useI18nContext } from '../../../hooks/useI18nContext';

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
} from '../../../helpers/constants/design-system';
import {
  AvatarNetwork,
  AvatarNetworkSize,
  BadgeWrapper,
  BadgeWrapperAnchorElementShape,
  Box,
  Text,
} from '../../component-library';

///: BEGIN:ONLY_INCLUDE_IN(build-mmi)
import { IconColor } from '../../../helpers/constants/design-system';
import { Icon, IconName, IconSize } from '../../component-library';
///: END:ONLY_INCLUDE_IN
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import {
  TransactionGroupCategory,
  TransactionStatus,
} from '../../../../shared/constants/transaction';
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
  checkNetworkAndAccountSupports1559,
  getCurrentNetwork,
  getTestNetworkBackgroundColor,
} from '../../../selectors';
import { isLegacyTransaction } from '../../../helpers/utils/transactions.util';
import { formatDateWithYearContext } from '../../../helpers/utils/util';
import Button from '../../ui/button';
import AdvancedGasFeePopover from '../advanced-gas-fee-popover';
import CancelButton from '../cancel-button';
///: BEGIN:ONLY_INCLUDE_IN(build-main,build-beta,build-flask)
import CancelSpeedupPopover from '../cancel-speedup-popover';
///: END:ONLY_INCLUDE_IN
import EditGasFeePopover from '../edit-gas-fee-popover';
import EditGasPopover from '../edit-gas-popover';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import { ActivityListItem } from '../../multichain';

function TransactionListItemInner({
  transactionGroup,
  setEditGasMode,
  isEarliestNonce = false,
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
  const testNetworkBackgroundColor = useSelector(getTestNetworkBackgroundColor);

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
      if (supportsEIP1559) {
        setEditGasMode(EditGasModes.cancel);
        openModal('cancelSpeedUpTransaction');
      } else {
        setShowCancelEditGasPopover(true);
      }
    },
    [trackEvent, openModal, setEditGasMode, supportsEIP1559],
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
    displayedStatusKey,
    isPending,
    senderAddress,
  } = useTransactionDisplayData(transactionGroup);
  const date = formatDateWithYearContext(
    transactionGroup.primaryTransaction.time,
    'MMM d, y',
    'MMM d',
  );
  const isSignatureReq = category === TransactionGroupCategory.signatureRequest;
  const isApproval = category === TransactionGroupCategory.approval;
  const isUnapproved = status === TransactionStatus.unapproved;
  const isSwap = category === TransactionGroupCategory.swap;
  ///: BEGIN:ONLY_INCLUDE_IN(build-mmi)
  const isCustodian = Boolean(transactionGroup.primaryTransaction.custodyId);
  ///: END:ONLY_INCLUDE_IN

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

  ///: BEGIN:ONLY_INCLUDE_IN(build-mmi)
  const debugTransactionMeta = {
    'data-hash': transactionGroup.primaryTransaction.hash,
    ...(isCustodian
      ? {
          'data-custodiantransactionid':
            transactionGroup.primaryTransaction.custodyId,
        }
      : {}),
  };
  ///: END:ONLY_INCLUDE_IN

  const speedUpButton = useMemo(() => {
    ///: BEGIN:ONLY_INCLUDE_IN(build-mmi)
    if (isCustodian) {
      return null;
    }
    ///: END:ONLY_INCLUDE_IN

    if (!shouldShowSpeedUp || !isPending || isUnapproved) {
      return null;
    }

    return (
      <Button
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
    hasCancelled,
    retryTransaction,
    cancelTransaction,
    ///: BEGIN:ONLY_INCLUDE_IN(build-mmi)
    isCustodian,
    ///: END:ONLY_INCLUDE_IN
  ]);
  const currentChain = useSelector(getCurrentNetwork);
  let showCancelButton = !hasCancelled && isPending && !isUnapproved;

  ///: BEGIN:ONLY_INCLUDE_IN(build-mmi)
  showCancelButton = showCancelButton && !isCustodian;
  const PENDING_COLOR = IconColor.iconAlternative;
  const OK_COLOR = IconColor.primaryDefault;
  const FAIL_COLOR = IconColor.errorDefault;
  const getTransactionColor = (tsStatus) => {
    switch (tsStatus) {
      case TransactionStatus.signed:
        return PENDING_COLOR;
      case TransactionStatus.rejected:
      case TransactionStatus.failed:
      case TransactionStatus.dropped:
        return FAIL_COLOR;
      default:
        return OK_COLOR;
    }
  };
  ///: END:ONLY_INCLUDE_IN

  return (
    <>
      <ActivityListItem
        data-testid="activity-list-item"
        onClick={toggleShowDetails}
        className={className}
        title={title}
        icon={
          ///: BEGIN:ONLY_INCLUDE_IN(build-mmi)
          isCustodian ? (
            <Box style={{ position: 'relative' }} data-testid="custody-icon">
              <TransactionIcon
                category={category}
                status={displayedStatusKey}
              />
              <Icon
                data-testid="custody-icon-badge"
                name={IconName.Custody}
                className="transaction-list-item__icon-badge"
                color={getTransactionColor(status)}
                size={IconSize.Xs}
              />
            </Box>
          ) : (
            ///: END:ONLY_INCLUDE_IN
            <BadgeWrapper
              anchorElementShape={BadgeWrapperAnchorElementShape.circular}
              positionObj={{ top: -4, right: -4 }}
              display={Display.Block}
              badge={
                <AvatarNetwork
                  className="activity-tx__network-badge"
                  data-testid="activity-tx-network-badge"
                  size={AvatarNetworkSize.Xs}
                  name={currentChain?.nickname}
                  src={currentChain?.rpcPrefs?.imageUrl}
                  borderWidth={1}
                  borderColor={BackgroundColor.backgroundDefault}
                  backgroundColor={testNetworkBackgroundColor}
                />
              }
            >
              <TransactionIcon
                category={category}
                status={displayedStatusKey}
              />
            </BadgeWrapper>
            ///: BEGIN:ONLY_INCLUDE_IN(build-mmi)
          )
          ///: END:ONLY_INCLUDE_IN
        }
        subtitle={
          <TransactionStatusLabel
            statusOnly
            isPending={isPending}
            isEarliestNonce={isEarliestNonce}
            error={error}
            date={date}
            status={displayedStatusKey}
            ///: BEGIN:ONLY_INCLUDE_IN(build-mmi)
            custodyStatus={transactionGroup.primaryTransaction.custodyStatus}
            custodyStatusDisplayText={
              transactionGroup.primaryTransaction.custodyStatusDisplayText
            }
            ///: END:ONLY_INCLUDE_IN
          />
        }
        rightContent={
          !isSignatureReq &&
          !isApproval && (
            <>
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
        <Box paddingTop={4} className="transaction-list-item__pending-actions">
          {showCancelButton && (
            <CancelButton
              transaction={transactionGroup.primaryTransaction}
              cancelTransaction={cancelTransaction}
            />
          )}
          {speedUpButton}
        </Box>
        {
          ///: BEGIN:ONLY_INCLUDE_IN(build-mmi)
          <a {...debugTransactionMeta} className="test-transaction-meta" />
          ///: END:ONLY_INCLUDE_IN
        }
      </ActivityListItem>
      {showDetails && (
        <TransactionListItemDetails
          title={title}
          onClose={toggleShowDetails}
          transactionGroup={transactionGroup}
          primaryCurrency={primaryCurrency}
          senderAddress={senderAddress}
          recipientAddress={recipientAddress}
          onRetry={retryTransaction}
          showRetry={
            ///: BEGIN:ONLY_INCLUDE_IN(build-mmi)
            !isCustodian &&
            ///: END:ONLY_INCLUDE_IN
            status === TransactionStatus.failed &&
            !isSwap
          }
          showSpeedUp={
            ///: BEGIN:ONLY_INCLUDE_IN(build-mmi)
            !isCustodian &&
            ///: END:ONLY_INCLUDE_IN
            shouldShowSpeedUp
          }
          isEarliestNonce={isEarliestNonce}
          onCancel={cancelTransaction}
          showCancel={
            ///: BEGIN:ONLY_INCLUDE_IN(build-mmi)
            !isCustodian &&
            ///: END:ONLY_INCLUDE_IN
            isPending &&
            !hasCancelled
          }
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
            {
              ///: BEGIN:ONLY_INCLUDE_IN(build-main,build-beta,build-flask)
              <CancelSpeedupPopover />
              ///: END:ONLY_INCLUDE_IN
            }
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
