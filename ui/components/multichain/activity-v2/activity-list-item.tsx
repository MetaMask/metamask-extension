import React from 'react';
import {
  Box,
  Text,
  BadgeWrapper,
  TextVariant,
} from '@metamask/design-system-react';
import { TransactionStatus } from '@metamask/transaction-controller';
// import { useSelector } from 'react-redux';
import { useI18nContext } from '../../../hooks/useI18nContext';
// import { getTransactionTypeTitle } from '../../../helpers/utils/transactions.util';
import TransactionIcon from '../../app/transaction-icon/transaction-icon';
import { useFormatters } from '../../../hooks/useFormatters';
// import {
//   getSelectedAddress,
//   selectNetworkConfigurationByChainId,
// } from '../../../selectors/selectors';
import type { TransactionViewModel } from '../../../../shared/acme-controller/types';
import { ChainIcon } from '../../app/chain-icon/chain-icon';
import {
  // extractAmountAndSymbol,
  calculateFiatFromMarketRates,
  getTransferAmount,
} from './helpers';
import { useGetTitle } from './hooks';
import { PendingTransactionActions } from './pending-transaction-actions';

type Props = {
  transaction: TransactionViewModel;
  onClick?: () => void;
  marketRates: Record<number, Record<string, number>>;
  currentCurrency: string;
};

export const ActivityListItem = ({
  transaction,
  onClick,
  marketRates,
  currentCurrency,
}: Props) => {
  const t = useI18nContext();
  const { formatTokenQuantity, formatCurrencyWithMinThreshold } =
    useFormatters();
  const { chainId, category } = transaction;

  // These properties may not exist on non-EVM transactions
  const { isError, pendingTransactionMeta } = transaction as {
    isError?: boolean;
    pendingTransactionMeta?: { status: string };
  };

  const title = useGetTitle(transaction);

  const { amount, symbol } = getTransferAmount(transaction.amounts);
  const fiatAmount = calculateFiatFromMarketRates(transaction, marketRates);

  const isPending = pendingTransactionMeta?.status === 'submitted';

  // Determine display status using actual failure detection
  let displayStatus = 'Confirmed';
  let statusColor = 'text-success-default';
  let transactionStatus = TransactionStatus.confirmed;

  if (isPending) {
    // Pending transactions may also be failed
    if (isError) {
      displayStatus = 'Failed';
      statusColor = 'text-error-default';
      transactionStatus = TransactionStatus.failed;
    } else {
      displayStatus = 'Pending';
      statusColor = 'text-warning-default';
      transactionStatus = TransactionStatus.submitted;
    }
  } else if (isError) {
    displayStatus = 'Failed';
    statusColor = 'text-error-default';
    transactionStatus = TransactionStatus.failed;
  }

  return (
    <Box
      className="px-4 py-3 bg-background-default cursor-pointer hover:bg-hover"
      onClick={onClick}
    >
      <div className="flex gap-4 items-center">
        <div className="flex-shrink-0">
          <BadgeWrapper badge={<ChainIcon chainId={chainId} />}>
            <TransactionIcon category={category} status={transactionStatus} />
          </BadgeWrapper>
        </div>

        {/* Left side - Action and Details */}
        <div className="flex-1 min-w-0">
          <Text className="font-medium truncate ">{title}</Text>
          <div className="flex gap-2 items-center">
            <Text variant={TextVariant.BodySm} className={statusColor}>
              {displayStatus}
            </Text>
          </div>
        </div>

        {/* Right side - Value */}
        <div className="flex flex-col items-end">
          {amount && symbol && (
            <Text className="font-medium">
              {formatTokenQuantity(amount, symbol)}
            </Text>
          )}
          {fiatAmount !== null && fiatAmount > 0 && (
            <Text
              variant={TextVariant.BodySm}
              className="text-text-alternative"
            >
              {formatCurrencyWithMinThreshold(fiatAmount, currentCurrency)}
            </Text>
          )}
        </div>
      </div>

      {/* Wrapper for existing pending transaction actions (speed up / cancel) */}
      {isPending && pendingTransactionMeta && (
        <PendingTransactionActions
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          transaction={pendingTransactionMeta as any}
          isEarliestNonce={true}
        />
      )}
    </Box>
  );
};
