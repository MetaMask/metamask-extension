import React from 'react';
import PropTypes from 'prop-types';
import { useDispatch } from 'react-redux';
import ListItem from '../../ui/list-item';
import TransactionStatus from '../transaction-status/transaction-status.component';
import TransactionIcon from '../transaction-icon';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { formatDateWithYearContext } from '../../../helpers/utils/util';
import {
  TRANSACTION_GROUP_CATEGORIES,
  TRANSACTION_GROUP_STATUSES,
} from '../../../../shared/constants/transaction';
import { cancelSmartTransaction } from '../../../store/actions';

import CancelButton from '../cancel-button';

export default function SmartTransactionListItem({
  smartTransaction,
  isEarliestNonce = false,
}) {
  console.log(`smartTransaction`, smartTransaction);
  const dispatch = useDispatch();
  const t = useI18nContext();
  const {
    sourceTokenSymbol,
    destinationTokenSymbol,
    time,
    status,
  } = smartTransaction;
  const category = TRANSACTION_GROUP_CATEGORIES.SWAP;
  const title = t('swapTokenToToken', [
    sourceTokenSymbol,
    destinationTokenSymbol,
  ]);
  const subtitle = 'metamask';
  const date = formatDateWithYearContext(time);
  let displayedStatusKey;
  if (
    !status?.minedTx ||
    (status?.minedTx === 'not_mined' &&
      status?.cancellationReason === 'not_cancelled')
  ) {
    displayedStatusKey = TRANSACTION_GROUP_STATUSES.PENDING;
  } else if (status?.cancellationReason === 'user_cancelled') {
    displayedStatusKey = TRANSACTION_GROUP_STATUSES.CANCELLED;
  }
  const className = 'transaction-list-item transaction-list-item--unconfirmed';
  return (
    <>
      <ListItem
        className={className}
        title={title}
        icon={
          <TransactionIcon category={category} status={displayedStatusKey} />
        }
        subtitle={
          <h3>
            <TransactionStatus
              isPending
              isEarliestNonce={isEarliestNonce}
              date={date}
              status={displayedStatusKey}
            />
            <span className="transaction-list-item__origin" title={subtitle}>
              {subtitle}
            </span>
          </h3>
        }
      >
        {displayedStatusKey === TRANSACTION_GROUP_STATUSES.PENDING && (
          <div className="transaction-list-item__pending-actions">
            <CancelButton
              transaction={smartTransaction.uuid}
              cancelTransaction={(e) => {
                e?.preventDefault();
                dispatch(cancelSmartTransaction(smartTransaction.uuid));
              }}
            />
          </div>
        )}
      </ListItem>
    </>
  );
}

SmartTransactionListItem.propTypes = {
  smartTransaction: PropTypes.object.isRequired,
  isEarliestNonce: PropTypes.bool,
};
