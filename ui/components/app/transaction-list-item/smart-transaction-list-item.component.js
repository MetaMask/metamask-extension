import React, { useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';
import TransactionStatusLabel from '../transaction-status-label/transaction-status-label';
import TransactionIcon from '../transaction-icon';
import { useTransactionDisplayData } from '../../../hooks/useTransactionDisplayData';
import { formatDateWithYearContext } from '../../../helpers/utils/util';
import {
  TransactionGroupStatus,
  SmartTransactionStatus,
} from '../../../../shared/constants/transaction';

import CancelButton from '../cancel-button';
import { cancelSwapsSmartTransaction } from '../../../ducks/swaps/swaps';
import TransactionListItemDetails from '../transaction-list-item-details';
import { ActivityListItem } from '../../multichain';
import {
  AvatarNetwork,
  AvatarNetworkSize,
  BadgeWrapper,
  BadgeWrapperAnchorElementShape,
  Box,
} from '../../component-library';
import {
  BackgroundColor,
  Display,
} from '../../../helpers/constants/design-system';
import { getCurrentNetwork } from '../../../selectors';

export default function SmartTransactionListItem({
  smartTransaction,
  transactionGroup,
  isEarliestNonce = false,
  chainId,
}) {
  const dispatch = useDispatch();
  const [cancelSwapLinkClicked, setCancelSwapLinkClicked] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const {
    title,
    category,
    primaryCurrency,
    recipientAddress,
    isPending,
    senderAddress,
  } = useTransactionDisplayData(transactionGroup);
  const currentChain = useSelector(getCurrentNetwork);

  const { time, status } = smartTransaction;
  const date = formatDateWithYearContext(time, 'MMM d, y', 'MMM d');
  let displayedStatusKey;
  if (status === SmartTransactionStatus.pending) {
    displayedStatusKey = TransactionGroupStatus.pending;
  } else if (status?.startsWith(SmartTransactionStatus.cancelled)) {
    displayedStatusKey = TransactionGroupStatus.cancelled;
  }
  const showCancelSwapLink =
    smartTransaction.cancellable && !cancelSwapLinkClicked;
  const className = 'transaction-list-item transaction-list-item--unconfirmed';
  const toggleShowDetails = useCallback(() => {
    setShowDetails((prev) => !prev);
  }, []);
  return (
    <>
      <ActivityListItem
        className={className}
        title={title}
        onClick={toggleShowDetails}
        icon={
          <BadgeWrapper
            anchorElementShape={BadgeWrapperAnchorElementShape.circular}
            display={Display.Block}
            badge={
              <AvatarNetwork
                className="activity-tx__network-badge"
                data-testid="activity-tx-network-badge"
                size={AvatarNetworkSize.Xs}
                name={currentChain?.nickname}
                src={currentChain?.rpcPrefs?.imageUrl}
                borderColor={BackgroundColor.backgroundDefault}
              />
            }
          >
            <TransactionIcon category={category} status={displayedStatusKey} />
          </BadgeWrapper>
        }
        subtitle={
          <TransactionStatusLabel
            isPending
            isEarliestNonce={isEarliestNonce}
            date={date}
            status={displayedStatusKey}
          />
        }
      >
        {displayedStatusKey === TransactionGroupStatus.pending &&
          showCancelSwapLink && (
            <Box
              paddingTop={4}
              className="transaction-list-item__pending-actions"
            >
              <CancelButton
                transaction={smartTransaction.uuid}
                cancelTransaction={(e) => {
                  e?.preventDefault();
                  dispatch(cancelSwapsSmartTransaction(smartTransaction.uuid));
                  setCancelSwapLinkClicked(true);
                }}
              />
            </Box>
          )}
      </ActivityListItem>
      {showDetails && (
        <TransactionListItemDetails
          title={title}
          onClose={toggleShowDetails}
          senderAddress={senderAddress}
          recipientAddress={recipientAddress}
          primaryCurrency={primaryCurrency}
          isEarliestNonce={isEarliestNonce}
          transactionGroup={transactionGroup}
          transactionStatus={() => (
            <TransactionStatusLabel
              isPending={isPending}
              isEarliestNonce={isEarliestNonce}
              date={date}
              status={displayedStatusKey}
              statusOnly
            />
          )}
          chainId={chainId}
        />
      )}
    </>
  );
}

SmartTransactionListItem.propTypes = {
  smartTransaction: PropTypes.object.isRequired,
  isEarliestNonce: PropTypes.bool,
  transactionGroup: PropTypes.object,
  chainId: PropTypes.string,
};
