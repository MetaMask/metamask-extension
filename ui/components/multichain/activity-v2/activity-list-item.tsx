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
import { useI18nContext } from '../../../hooks/useI18nContext';
import { getTransactionTypeTitle } from '../../../helpers/utils/transactions.util';
import TransactionIcon from '../../app/transaction-icon/transaction-icon';
import { useFormatters } from '../../../hooks/useFormatters';
import {
  getSelectedAddress,
  selectNetworkConfigurationByChainId,
} from '../../../selectors/selectors';
import type { TransactionViewModel } from '../../../../shared/acme-controller/types';
import { TransactionGroupCategory } from '../../../../shared/constants/transaction';
import {
  extractAmountAndSymbol,
  calculateFiatFromMarketRates,
  mapChainInfo,
} from './helpers';
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
  const selectedAddress = useSelector(getSelectedAddress)?.toLowerCase();
  const {
    readable,
    chainId,
    isError,
    pendingTransactionMeta,
    category = TransactionGroupCategory.interaction,
  } = transaction;

  const chainIdHex = `0x${transaction.chainId.toString(16)}`;
  const nativeCurrency = useSelector((state) =>
    selectNetworkConfigurationByChainId(state, chainIdHex),
  )?.nativeCurrency;

  const title =
    readable ??
    getTransactionTypeTitle(t, pendingTransactionMeta?.type, nativeCurrency);

  // Extract amount and symbol
  const { amount, symbol } = extractAmountAndSymbol(
    transaction,
    selectedAddress,
    nativeCurrency,
  );

  const fiatAmount = calculateFiatFromMarketRates(transaction, marketRates);

  const { chainImageUrl, chainName } = mapChainInfo(chainId);

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
          <Text className="font-medium truncate ">{title}</Text>
          <div className="flex gap-2 items-center">
            <Text variant={TextVariant.BodySm} className={statusColor}>
              {displayStatus}
            </Text>
          </div>
        </div>

        {/* Right side - Value */}
        <div className="flex flex-col items-end">
          {amount !== 0 && symbol && (
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
          transaction={pendingTransactionMeta}
          isEarliestNonce={true}
        />
      )}
    </Box>
  );
};
