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
import TransactionStatusLabel from '../transaction-status-label/transaction-status-label';
import TransactionIcon from '../transaction-icon';
import { EVENT } from '../../../../shared/constants/metametrics';
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
import { checkNetworkAndAccountSupports1559 } from '../../../selectors';
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
  const [showCancelEditGasPopover, setShowCancelEditGasPopover] =
    useState(false);
  const [showRetryEditGasPopover, setShowRetryEditGasPopover] = useState(false);
  const { supportsEIP1559 } = useGasFeeContext();
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
        category: EVENT.CATEGORIES.NAVIGATION,
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

  const isSignatureReq = category === TransactionGroupCategory.signatureRequest;
  const isApproval = category === TransactionGroupCategory.approval;
  const isUnapproved = status === TransactionStatus.unapproved;
  const isSwap = category === TransactionGroupCategory.swap;

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
            <TransactionStatusLabel
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
          showRetry={status === TransactionStatus.failed && !isSwap}
          showSpeedUp={shouldShowSpeedUp}
          isEarliestNonce={isEarliestNonce}
          onCancel={cancelTransaction}
          showCancel={isPending && !hasCancelled}
          transactionStatus={() => (
            <TransactionStatusLabel
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
