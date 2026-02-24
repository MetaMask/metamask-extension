import React from 'react';
import type { Transaction } from '@metamask/keyring-api';
import { TransactionType as KeyringTransactionType } from '@metamask/keyring-api';
import { isCrossChain } from '@metamask/bridge-controller';
import { useSelector } from 'react-redux';
import { Text } from '@metamask/design-system-react';
import {
  useMultichainTransactionDisplay,
  KEYRING_TRANSACTION_STATUS_KEY,
} from '../../../hooks/useMultichainTransactionDisplay';
import { TransactionGroupCategory } from '../../../../shared/constants/transaction';
import TransactionIcon from '../../app/transaction-icon/transaction-icon';
import TransactionStatusLabel from '../../app/transaction-status-label/transaction-status-label';
import { formatTimestamp } from '../../app/multichain-transaction-details-modal/helpers';
import { ActivityListItem as LegacyActivityListItem } from '../activity-list-item';
import { getSelectedMultichainNetworkConfiguration } from '../../../selectors/multichain/networks';
import { ChainBadge } from '../../app/chain-badge/chain-badge';
import { selectBridgeHistoryForAccountGroup } from '../../../ducks/bridge-status/selectors';
import LegacyMultichainBridgeListItem from '../../app/multichain-bridge-transaction-list-item/multichain-bridge-transaction-list-item';

type Props = {
  transaction: Transaction;
  onClick: (tx: Transaction) => void;
};

// Wrapper around TransactionListItem for non-EVM transactions
// until we properly map values to the new ActivityListItem
export const NonEvmActivityListItem = ({ transaction, onClick }: Props) => {
  const networkConfig = useSelector(getSelectedMultichainNetworkConfiguration);
  const bridgeHistoryItems = useSelector(selectBridgeHistoryForAccountGroup);
  const matchedBridgeHistoryItem = bridgeHistoryItems[transaction.id];
  const { from, to, type, timestamp, isRedeposit, title } =
    useMultichainTransactionDisplay(transaction, networkConfig);
  const statusKey = KEYRING_TRANSACTION_STATUS_KEY[transaction.status];

  if (
    matchedBridgeHistoryItem &&
    isCrossChain(
      matchedBridgeHistoryItem.quote?.srcChainId,
      matchedBridgeHistoryItem.quote?.destChainId,
    )
  ) {
    return (
      <LegacyMultichainBridgeListItem
        transaction={transaction}
        bridgeHistoryItem={matchedBridgeHistoryItem}
        toggleShowDetails={onClick}
      />
    );
  }

  if (isRedeposit) {
    return (
      <LegacyActivityListItem
        data-testid="activity-list-item"
        onClick={() => onClick(transaction)}
        icon={
          <ChainBadge chainId={transaction.chain}>
            <TransactionIcon
              category={TransactionGroupCategory.redeposit}
              status={statusKey}
            />
          </ChainBadge>
        }
        title="Redeposit"
        subtitle={
          <TransactionStatusLabel
            date={formatTimestamp(timestamp)}
            error={{}}
            status={statusKey}
            statusOnly
          />
        }
      />
    );
  }

  let { amount, unit } = to ?? {};
  let category = type as TransactionGroupCategory;
  if (type === KeyringTransactionType.Swap) {
    amount = from?.amount;
    unit = from?.unit;
  }

  if (type === KeyringTransactionType.Unknown) {
    category = TransactionGroupCategory.interaction;
  }

  return (
    <LegacyActivityListItem
      data-testid="activity-list-item"
      onClick={() => onClick(transaction)}
      icon={
        <ChainBadge chainId={transaction.chain}>
          <TransactionIcon category={category} status={statusKey} />
        </ChainBadge>
      }
      rightContent={
        <Text
          className="activity-list-item__primary-currency"
          data-testid="transaction-list-item-primary-currency"
          ellipsis
        >
          {amount} {unit}
        </Text>
      }
      title={title}
      subtitle={
        <TransactionStatusLabel
          date={formatTimestamp(transaction.timestamp)}
          error={{}}
          status={statusKey}
          statusOnly
        />
      }
    />
  );
};
