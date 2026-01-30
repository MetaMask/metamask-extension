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
import { useI18nContext } from '../../../hooks/useI18nContext';
import { PendingTransactionActions } from './pending-transaction-actions';

type Props = {
  transaction: TransactionForDisplay;
  onClick?: () => void;
};

/**
 * Detects if a transaction actually failed based on transaction data
 * For ERC20 transfers, successful transactions MUST emit a Transfer event in logs
 * If logs array is empty, the transaction reverted/failed
 *
 * @param transaction
 * @param isError
 */
const detectActualFailure = (
  transaction: TransactionForDisplay,
  isError: boolean | undefined,
): boolean => {
  // If API already marked as error, trust that
  if (isError) {
    return true;
  }

  // Check for ERC20 transfer with empty logs (indicates failure)
  const isERC20Transfer =
    transaction.transactionType === 'ERC_20_TRANSFER' ||
    transaction.transactionProtocol === 'ERC_20';
  const hasEmptyLogs = !transaction.logs || transaction.logs.length === 0;

  if (isERC20Transfer && hasEmptyLogs) {
    return true;
  }

  return false;
};

export const ActivityListItem = ({ transaction, onClick }: Props) => {
  const { formatToken, formatCurrencyWithMinThreshold } = useFormatters();
  const t = useI18nContext() as (
    key: string,
    substitutions?: string[],
  ) => string;
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

  // Detect actual failure status (checks logs for ERC20 transfers)
  const actuallyFailed = detectActualFailure(transaction, isError);

  // Determine transaction category and action
  const { category, action } = extractCategoryAndAction(
    transaction,
    selectedAddress,
    t,
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

  // Determine display status using actual failure detection
  let displayStatus = 'Confirmed';
  let statusColor = 'text-success-default';
  let transactionStatus = TransactionStatus.confirmed;

  if (isPending) {
    // Pending transactions may also be failed
    if (actuallyFailed) {
      displayStatus = 'Failed';
      statusColor = 'text-error-default';
      transactionStatus = TransactionStatus.failed;
    } else {
      displayStatus = 'Pending';
      statusColor = 'text-warning-default';
      transactionStatus = TransactionStatus.submitted;
    }
  } else if (actuallyFailed) {
    displayStatus = 'Failed';
    statusColor = 'text-error-default';
    transactionStatus = TransactionStatus.failed;
  }

  return (
    <Box
      className="px-4 py-3 bg-background-default border-b border-border-muted cursor-pointer hover:bg-hover"
      onClick={onClick}
    >
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
