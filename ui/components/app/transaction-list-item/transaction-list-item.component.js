import React, { useMemo, useState, useCallback, useContext } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { useHistory } from 'react-router-dom';
import { useSelector } from 'react-redux';

import ListItem from '../../ui/list-item';
import { useTransactionDisplayData } from '../../../hooks/useTransactionDisplayData';
import { useI18nContext } from '../../../hooks/useI18nContext';

import TransactionListItemDetails from '../transaction-list-item-details';
import { CONFIRM_TRANSACTION_ROUTE } from '../../../helpers/constants/routes';
import { useShouldShowSpeedUp } from '../../../hooks/useShouldShowSpeedUp';
import TransactionStatus from '../transaction-status/transaction-status.component';
import TransactionIcon from '../transaction-icon';
import { EVENT } from '../../../../shared/constants/metametrics';
import {
  TRANSACTION_GROUP_CATEGORIES,
  TRANSACTION_STATUSES,
} from '../../../../shared/constants/transaction';
import { EDIT_GAS_MODES } from '../../../../shared/constants/gas';
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
  getEIP1559V2Enabled,
} from '../../../selectors';
import { isLegacyTransaction } from '../../../helpers/utils/transactions.util';
import Button from '../../ui/button';
import AdvancedGasFeePopover from '../advanced-gas-fee-popover';
import CancelButton from '../cancel-button';
import CancelSpeedupPopover from '../cancel-speedup-popover';
import EditGasFeePopover from '../edit-gas-fee-popover';
import EditGasPopover from '../edit-gas-popover';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import SiteOrigin from '../../ui/site-origin';

function TransactionListItemInner({
  transactionGroup,
  setEditGasMode,
  isEarliestNonce = false,
}) {
  const t = useI18nContext();
  const history = useHistory();
  const { hasCancelled } = transactionGroup;
  const [showDetails, setShowDetails] = useState(false);
  const [showCancelEditGasPopover, setShowCancelEditGasPopover] = useState(
    false,
  );
  const [showRetryEditGasPopover, setShowRetryEditGasPopover] = useState(false);
  const { supportsEIP1559V2 } = useGasFeeContext();
  const { openModal } = useTransactionModalContext();

  const {
    initialTransaction: { id },
    primaryTransaction: { err, status },
  } = transactionGroup;

  const trackEvent = useContext(MetaMetricsContext);

  const retryTransaction = useCallback(
    async (event) => {
      event.stopPropagation();
      trackEvent({
        event: 'Clicked "Speed Up"',
        category: EVENT.CATEGORIES.NAVIGATION,
        properties: {
          action: 'Activity Log',
          legacy_event: true,
        },
      });
      if (supportsEIP1559V2) {
        setEditGasMode(EDIT_GAS_MODES.SPEED_UP);
        openModal('cancelSpeedUpTransaction');
      } else {
        setShowRetryEditGasPopover(true);
      }
    },
    [openModal, setEditGasMode, trackEvent, supportsEIP1559V2],
  );

  const cancelTransaction = useCallback(
    (event) => {
      event.stopPropagation();
      trackEvent({
        event: 'Clicked "Cancel"',
        category: EVENT.CATEGORIES.NAVIGATION,
        properties: {
          action: 'Activity Log',
          legacy_event: true,
        },
      });
      if (supportsEIP1559V2) {
        setEditGasMode(EDIT_GAS_MODES.CANCEL);
        openModal('cancelSpeedUpTransaction');
      } else {
        setShowCancelEditGasPopover(true);
      }
    },
    [trackEvent, openModal, setEditGasMode, supportsEIP1559V2],
  );

  const shouldShowSpeedUp = useShouldShowSpeedUp(
    transactionGroup,
    isEarliestNonce,
  );

  const {
    title,
    subtitle,
    subtitleContainsOrigin,
    date,
    category,
    primaryCurrency,
    recipientAddress,
    secondaryCurrency,
    displayedStatusKey,
    isPending,
    senderAddress,
  } = useTransactionDisplayData(transactionGroup);

  const isSignatureReq =
    category === TRANSACTION_GROUP_CATEGORIES.SIGNATURE_REQUEST;
  const isApproval = category === TRANSACTION_GROUP_CATEGORIES.APPROVAL;
  const isUnapproved = status === TRANSACTION_STATUSES.UNAPPROVED;
  const isSwap = category === TRANSACTION_GROUP_CATEGORIES.SWAP;

  const className = classnames('transaction-list-item', {
    'transaction-list-item--unconfirmed':
      isPending ||
      [
        TRANSACTION_STATUSES.FAILED,
        TRANSACTION_STATUSES.DROPPED,
        TRANSACTION_STATUSES.REJECTED,
      ].includes(displayedStatusKey),
  });

  const toggleShowDetails = useCallback(() => {
    if (isUnapproved) {
      history.push(`${CONFIRM_TRANSACTION_ROUTE}/${id}`);
      return;
    }
    setShowDetails((prev) => !prev);
  }, [isUnapproved, history, id]);

  const speedUpButton = useMemo(() => {
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
  ]);

  const showCancelButton = !hasCancelled && isPending && !isUnapproved;

  return (
    <>
      <ListItem
        onClick={toggleShowDetails}
        className={className}
        title={title}
        icon={
          <TransactionIcon category={category} status={displayedStatusKey} />
        }
        subtitle={
          <h3>
            <TransactionStatus
              isPending={isPending}
              isEarliestNonce={isEarliestNonce}
              error={err}
              date={date}
              status={displayedStatusKey}
            />
            {subtitleContainsOrigin ? (
              <SiteOrigin siteOrigin={subtitle} />
            ) : (
              <span className="transaction-list-item__address" title={subtitle}>
                {subtitle}
              </span>
            )}
          </h3>
        }
        rightContent={
          !isSignatureReq &&
          !isApproval && (
            <>
              <h2
                title={primaryCurrency}
                className="transaction-list-item__primary-currency"
              >
                {primaryCurrency}
              </h2>
              <h3 className="transaction-list-item__secondary-currency">
                {secondaryCurrency}
              </h3>
            </>
          )
        }
      >
        <div className="transaction-list-item__pending-actions">
          {speedUpButton}
          {showCancelButton && (
            <CancelButton
              transaction={transactionGroup.primaryTransaction}
              cancelTransaction={cancelTransaction}
            />
          )}
        </div>
      </ListItem>
      {showDetails && (
        <TransactionListItemDetails
          title={title}
          onClose={toggleShowDetails}
          transactionGroup={transactionGroup}
          primaryCurrency={primaryCurrency}
          senderAddress={senderAddress}
          recipientAddress={recipientAddress}
          onRetry={retryTransaction}
          showRetry={status === TRANSACTION_STATUSES.FAILED && !isSwap}
          showSpeedUp={shouldShowSpeedUp}
          isEarliestNonce={isEarliestNonce}
          onCancel={cancelTransaction}
          showCancel={isPending && !hasCancelled}
          transactionStatus={() => (
            <TransactionStatus
              isPending={isPending}
              isEarliestNonce={isEarliestNonce}
              error={err}
              date={date}
              status={displayedStatusKey}
              statusOnly
            />
          )}
        />
      )}
      {!supportsEIP1559V2 && showRetryEditGasPopover && (
        <EditGasPopover
          onClose={() => setShowRetryEditGasPopover(false)}
          mode={EDIT_GAS_MODES.SPEED_UP}
          transaction={transactionGroup.primaryTransaction}
        />
      )}
      {!supportsEIP1559V2 && showCancelEditGasPopover && (
        <EditGasPopover
          onClose={() => setShowCancelEditGasPopover(false)}
          mode={EDIT_GAS_MODES.CANCEL}
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
  const eip1559V2Enabled = useSelector(getEIP1559V2Enabled);

  const supportsEIP1559 =
    useSelector(checkNetworkAndAccountSupports1559) &&
    !isLegacyTransaction(transaction?.txParams);

  const supportsEIP1559V2 = eip1559V2Enabled && supportsEIP1559;

  return (
    <GasFeeContextProvider
      transaction={transactionGroup.primaryTransaction}
      editGasMode={editGasMode}
    >
      <TransactionModalContextProvider>
        <TransactionListItemInner {...props} setEditGasMode={setEditGasMode} />
        {supportsEIP1559V2 && (
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
