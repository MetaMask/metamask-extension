import React from 'react';
import { useSelector } from 'react-redux';
import {
  Box,
  Text,
  BadgeWrapper,
  TextVariant,
} from '@metamask/design-system-react';
import { TransactionStatus } from '@metamask/transaction-controller';
import TransactionIcon from '../../app/transaction-icon/transaction-icon';
import { useFormatters } from '../../../hooks/useFormatters';
import type { TransactionViewModel } from '../../../../shared/acme-controller/types';
import { ChainIcon } from '../../app/chain-icon/chain-icon';
import { getCurrentCurrency } from '../../../ducks/metamask/metamask';
import { getMarketRates } from '../../../selectors/activity';
import { calculateFiatFromMarketRates, getTransferAmount } from './helpers';
import { useGetTitle } from './hooks';

type Props = {
  transaction: TransactionViewModel;
  onClick?: () => void;
};

export const ActivityListItem = ({ transaction, onClick }: Props) => {
  const currentCurrency = useSelector(getCurrentCurrency);
  const marketRates = useSelector(getMarketRates);
  const { formatTokenQuantity, formatCurrencyWithMinThreshold } =
    useFormatters();
  const { chainId, category } = transaction;

  // These properties may not exist on non-EVM transactions
  const { isError } = transaction as {
    isError?: boolean;
  };

  const title = useGetTitle(transaction);
  const { amount, symbol } = getTransferAmount(transaction.amounts);
  const fiatAmount = calculateFiatFromMarketRates(transaction, marketRates);

  let displayStatus = 'Confirmed';
  let statusColor = 'text-success-default';
  let transactionStatus = TransactionStatus.confirmed;

  if (isError) {
    displayStatus = 'Failed';
    statusColor = 'text-error-default';
    transactionStatus = TransactionStatus.failed;
  }

  return (
    <Box
      className="px-4 py-3 bg-background-default cursor-pointer hover:bg-hover activity-list-item"
      onClick={onClick}
      data-testid="activity-list-item"
    >
      <div className="flex gap-4 items-center">
        <div className="flex-shrink-0">
          <BadgeWrapper badge={<ChainIcon chainId={chainId} />}>
            <TransactionIcon category={category} status={transactionStatus} />
          </BadgeWrapper>
        </div>

        {/* Left side - Action and Details */}
        <div className="flex-1 min-w-0">
          <Text
            className="font-medium truncate"
            data-testid="activity-list-item-action"
          >
            {title}
          </Text>
          <div className="flex gap-2 items-center">
            <Text
              variant={TextVariant.BodySm}
              className={statusColor}
              data-testid={`activity-list-item-status-${transactionStatus}`}
            >
              {displayStatus}
            </Text>
          </div>
        </div>

        {/* Right side - Value */}
        <div className="flex flex-col items-end">
          {amount && symbol && (
            <Text
              className="font-medium"
              data-testid="transaction-list-item-primary-currency"
            >
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
    </Box>
  );
};
