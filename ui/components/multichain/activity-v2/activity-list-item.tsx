import React from 'react';
import {
  Box,
  Text,
  AvatarNetwork,
  AvatarNetworkSize,
  BadgeWrapper,
  TextVariant,
} from '@metamask/design-system-react';
import { TransactionStatus } from '@metamask/transaction-controller';
import { useSelector } from 'react-redux';
import TransactionIcon from '../../app/transaction-icon/transaction-icon';
import { useFormatters } from '../../../hooks/useFormatters';
import {
  getMarketData,
  getCurrencyRates,
  getSelectedAddress,
} from '../../../selectors/selectors';
import { getCurrentCurrency } from '../../../ducks/metamask/metamask';
import { getNetworkConfigurationsByChainIdDecimal } from '../../../../shared/modules/selectors/networks';
import {
  extractCategoryAndAction,
  extractAmountAndSymbol,
  calculateTransactionFiatAmount as calculateFiatAmount,
  extractChainDisplayInfo as extractChainInfo,
} from '../../../helpers/transaction-mappers';
import type { TransactionForDisplay } from '../../../helpers/types';
import { PendingTransactionActions } from './pending-transaction-actions';

type Props = {
  transaction: TransactionForDisplay;
};

export const ActivityListItem = ({ transaction }: Props) => {
  const { formatToken, formatCurrencyWithMinThreshold } = useFormatters();
  const selectedAddress = useSelector(getSelectedAddress)?.toLowerCase();
  const currentCurrency = useSelector(getCurrentCurrency);
  const currencyRates = useSelector(getCurrencyRates);
  const marketData = useSelector(getMarketData) as Record<
    string,
    Record<string, { price: number }>
  >;
  const networkConfigsByChainIdDecimal = useSelector(
    getNetworkConfigurationsByChainIdDecimal,
  );

  const { chainId, isError, pendingTransactionMeta } = transaction;
  const isPending = Boolean(pendingTransactionMeta);

  // Determine transaction category and action
  const { category, action } = extractCategoryAndAction(
    transaction,
    selectedAddress,
  );

  // Extract amount and symbol
  const { amount, symbol } = extractAmountAndSymbol(
    transaction,
    selectedAddress,
    networkConfigsByChainIdDecimal,
  );

  // Calculate fiat amount
  const fiatAmount = calculateFiatAmount(
    transaction,
    amount,
    marketData,
    currencyRates,
    networkConfigsByChainIdDecimal,
  );

  const { chainImageUrl, chainName } = extractChainInfo(chainId);

  // Determine display status
  let displayStatus = 'Confirmed';
  let statusColor = 'text-success-default';
  let transactionStatus = TransactionStatus.confirmed;

  if (isPending) {
    displayStatus = 'Pending';
    statusColor = 'text-warning-default';
    transactionStatus = TransactionStatus.submitted;
  } else if (isError) {
    displayStatus = 'Failed';
    statusColor = 'text-error-default';
    transactionStatus = TransactionStatus.failed;
  }

  return (
    <Box className="px-4 py-3 bg-background-default border-b border-border-muted">
      <div className="flex gap-4 items-center">
        <div className="flex-shrink-0">
          <BadgeWrapper
            badge={
              <AvatarNetwork
                name={chainName}
                src={chainImageUrl}
                size={AvatarNetworkSize.Xs}
                className="rounded-full"
              />
            }
          >
            <TransactionIcon category={category} status={transactionStatus} />
          </BadgeWrapper>
        </div>

        {/* Left side - Action and Details */}
        <div className="flex-1 min-w-0">
          <Text className="font-medium truncate ">{action}</Text>
          <div className="flex gap-2 items-center">
            <Text variant={TextVariant.BodySm} className={statusColor}>
              {displayStatus}
            </Text>
          </div>
        </div>

        {/* Right side - Value */}
        <div className="flex flex-col items-end">
          {amount !== 0 && (
            <Text className="font-medium">{formatToken(amount, symbol)}</Text>
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

      {/* Pending transaction actions (speed up / cancel) */}
      {pendingTransactionMeta && (
        <PendingTransactionActions
          transaction={pendingTransactionMeta}
          isEarliestNonce={true}
        />
      )}
    </Box>
  );
};
