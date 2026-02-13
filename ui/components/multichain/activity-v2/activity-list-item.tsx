import React from 'react';
import { useSelector } from 'react-redux';
import { Box, Text, TextVariant } from '@metamask/design-system-react';
import { TransactionStatus } from '@metamask/transaction-controller';
import TransactionIcon from '../../app/transaction-icon/transaction-icon';
import TransactionStatusLabel from '../../app/transaction-status-label/transaction-status-label';
import { useFormatters } from '../../../hooks/useFormatters';
import type { TransactionViewModel } from '../../../../shared/acme-controller/types';
import { getCurrentCurrency } from '../../../ducks/metamask/metamask';
import { getMarketRates } from '../../../selectors/activity';
import { ChainBadge } from '../../app/chain-badge/chain-badge';
import { calculateFiatFromMarketRates, getTransferAmount } from './helpers';
import { useGetTitle } from './hooks';

type Props = {
  transaction: TransactionViewModel;
  onClick?: () => void;
};

export const ActivityListItem = ({ transaction, onClick }: Props) => {
  const currentCurrency = useSelector(getCurrentCurrency);
  const marketRates = useSelector(getMarketRates);
  const { formatTokenAmount, formatCurrencyWithMinThreshold } = useFormatters();
  const { chainId, category, status } = transaction;

  const title = useGetTitle(transaction);
  const { amount, symbol } = getTransferAmount(transaction.amounts ?? {});
  const fiatAmount = calculateFiatFromMarketRates(transaction, marketRates);

  const transactionStatus =
    status === TransactionStatus.failed
      ? TransactionStatus.failed
      : TransactionStatus.confirmed;

  return (
    <Box
      className="px-4 py-3 bg-background-default cursor-pointer hover:bg-hover activity-list-item"
      onClick={onClick}
      data-testid="activity-list-item"
    >
      <div className="flex gap-4 items-center">
        <div className="flex-shrink-0">
          <ChainBadge chainId={chainId}>
            <TransactionIcon category={category} status={transactionStatus} />
          </ChainBadge>
        </div>

        {/* Left side - Action and Details */}
        <div className="flex-1 min-w-0">
          <Text
            className="font-medium truncate"
            data-testid="activity-list-item-action"
          >
            {title}
          </Text>
          <Text variant={TextVariant.BodySm}>
            <TransactionStatusLabel status={transactionStatus} statusOnly />
          </Text>
        </div>

        {/* Right side - Value */}
        <div className="flex flex-col items-end">
          {amount && symbol && (
            <Text
              className="font-medium"
              data-testid="transaction-list-item-primary-currency"
            >
              {formatTokenAmount(amount, symbol)}
            </Text>
          )}
          {fiatAmount !== null && (
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
