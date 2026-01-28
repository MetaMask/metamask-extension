import React, { useCallback } from 'react';
import {
  twMerge,
  Box,
  BoxFlexDirection,
  BoxAlignItems,
  ButtonBase,
  Text,
  TextVariant,
  TextColor,
  FontWeight,
  AvatarTokenSize,
} from '@metamask/design-system-react';
import { PerpsTokenLogo } from '../perps-token-logo';
import {
  getDisplayName,
  formatRelativeTime,
  getTransactionAmountColor,
} from '../utils';
import type { PerpsTransaction } from '../types';

export type TransactionCardProps = {
  transaction: PerpsTransaction;
  onClick?: (transaction: PerpsTransaction) => void;
  variant?: 'default' | 'muted';
};

/**
 * TransactionCard component displays individual transaction information
 * Two rows: logo + title/subtitle on left, amount + time on right
 *
 * @param options0 - Component props
 * @param options0.transaction - The transaction data to display
 * @param options0.onClick - Optional click handler
 * @param options0.variant - Visual variant - 'default' for normal, 'muted' for subdued
 */
export const TransactionCard: React.FC<TransactionCardProps> = ({
  transaction,
  onClick,
  variant = 'default',
}) => {
  const displayName = getDisplayName(transaction.symbol);

  const handleClick = useCallback(() => {
    if (onClick) {
      onClick(transaction);
    }
  }, [transaction, onClick]);

  const baseStyles = 'cursor-pointer px-4 py-3';
  const variantStyles =
    variant === 'muted'
      ? 'bg-muted hover:bg-muted-hover active:bg-muted-pressed'
      : 'bg-default hover:bg-hover active:bg-pressed';

  // Determine the amount to display based on transaction type
  const getAmountDisplay = (): { text: string; color: TextColor } => {
    if (transaction.fill?.realizedPnl) {
      return {
        text: `${transaction.fill.realizedPnl.startsWith('-') ? '-' : '+'}$${transaction.fill.realizedPnl.replace(/^[+-]/u, '')}`,
        color: getTransactionAmountColor(transaction.fill.realizedPnl),
      };
    }
    if (transaction.funding) {
      const { amount } = transaction.funding;
      const isNegative = amount.startsWith('-');
      return {
        text: `${isNegative ? '-' : '+'}$${amount.replace(/^[+-]/u, '')}`,
        color: isNegative ? TextColor.ErrorDefault : TextColor.SuccessDefault,
      };
    }
    if (transaction.depositWithdrawal) {
      const isWithdrawal = transaction.type === 'withdrawal';
      return {
        text: `${isWithdrawal ? '-' : '+'}$${transaction.depositWithdrawal.amount}`,
        color: isWithdrawal ? TextColor.ErrorDefault : TextColor.SuccessDefault,
      };
    }
    // For trades without realized PnL, return empty (don't show symbol)
    if (transaction.type === 'trade') {
      return { text: '', color: TextColor.TextDefault };
    }
    // For orders, show status in muted text
    if (transaction.type === 'order' && transaction.order) {
      const status = transaction.order.status;
      // Only show certain statuses, blank for 'open'
      const statusText =
        status === 'filled'
          ? 'Filled'
          : status === 'canceled'
            ? 'Canceled'
            : status === 'queued'
              ? 'Queued'
              : status === 'rejected'
                ? 'Rejected'
                : status === 'triggered'
                  ? 'Triggered'
                  : '';
      return { text: statusText, color: TextColor.TextMuted };
    }
    return { text: displayName, color: TextColor.TextDefault };
  };

  const amountDisplay = getAmountDisplay();

  // Construct subtitle display based on transaction type
  const getSubtitleDisplay = (): string => {
    if (transaction.type === 'trade' && transaction.fill) {
      return `${transaction.fill.size} ${displayName}`;
    }
    // For orders, extract size + symbol from subtitle (format: "X SYMBOL @ $Y.YY")
    if (transaction.type === 'order') {
      const atIndex = transaction.subtitle.indexOf(' @');
      if (atIndex > 0) {
        return transaction.subtitle.substring(0, atIndex);
      }
    }
    // For funding, show asset symbol
    if (transaction.type === 'funding') {
      return displayName;
    }
    // For deposits/withdrawals, show status
    if (transaction.type === 'deposit' || transaction.type === 'withdrawal') {
      return 'Completed';
    }
    return transaction.subtitle;
  };

  return (
    <ButtonBase
      className={twMerge(
        // Reset ButtonBase defaults for card layout
        'justify-start rounded-none min-w-0 h-auto',
        // Card styles
        'gap-3 text-left',
        baseStyles,
        variantStyles,
      )}
      isFullWidth
      onClick={handleClick}
      data-testid={`transaction-card-${transaction.id}`}
    >
      {/* Token Logo */}
      <PerpsTokenLogo
        symbol={transaction.symbol}
        size={AvatarTokenSize.Md}
        className="shrink-0"
      />

      {/* Left side: Title and subtitle */}
      <Box
        className="min-w-0 flex-1"
        flexDirection={BoxFlexDirection.Column}
        alignItems={BoxAlignItems.Start}
        gap={1}
      >
        <Text fontWeight={FontWeight.Medium}>{transaction.title}</Text>
        <Text variant={TextVariant.BodySm} color={TextColor.TextAlternative}>
          {getSubtitleDisplay()}
        </Text>
      </Box>

      {/* Right side: Amount and time */}
      <Box
        className="shrink-0"
        flexDirection={BoxFlexDirection.Column}
        alignItems={BoxAlignItems.End}
        gap={1}
      >
        <Text
          variant={TextVariant.BodySm}
          fontWeight={FontWeight.Medium}
          color={amountDisplay.color}
        >
          {amountDisplay.text}
        </Text>
        {transaction.type !== 'trade' &&
          transaction.type !== 'order' &&
          transaction.type !== 'funding' &&
          transaction.type !== 'deposit' &&
          transaction.type !== 'withdrawal' && (
            <Text variant={TextVariant.BodySm} color={TextColor.TextAlternative}>
              {formatRelativeTime(transaction.timestamp)}
            </Text>
          )}
      </Box>
    </ButtonBase>
  );
};

export default TransactionCard;
