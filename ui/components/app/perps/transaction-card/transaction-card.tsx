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
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { PerpsTokenLogo } from '../perps-token-logo';
import { getDisplayName, getTransactionAmountColor } from '../utils';
import type { PerpsTransaction } from '../types';

export type TransactionCardProps = {
  transaction: PerpsTransaction;
  onClick?: (transaction: PerpsTransaction) => void;
  variant?: 'default' | 'muted';
};

const ORDER_STATUS_TO_I18N_KEY: Record<string, string> = {
  open: 'perpsStatusOpen',
  filled: 'perpsStatusFilled',
  canceled: 'perpsStatusCanceled',
  queued: 'perpsStatusQueued',
  rejected: 'perpsStatusRejected',
  triggered: 'perpsStatusTriggered',
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
  const t = useI18nContext();
  const displayName = getDisplayName(transaction.symbol);

  const handleClick = useCallback(() => {
    if (onClick) {
      onClick(transaction);
    }
  }, [transaction, onClick]);

  const variantStyles =
    variant === 'muted'
      ? 'bg-muted hover:bg-muted-hover active:bg-muted-pressed'
      : 'bg-default hover:bg-hover active:bg-pressed';

  // Determine the amount to display based on transaction type
  const getAmountDisplay = (): { text: string; color: TextColor } => {
    if (transaction.fill?.pnl) {
      return {
        text: `${transaction.fill.pnl.startsWith('-') ? '-' : '+'}$${transaction.fill.pnl.replace(/^[+-]/u, '')}`,
        color: getTransactionAmountColor(transaction.fill.pnl),
      };
    }
    if (transaction.fundingAmount) {
      const { fee } = transaction.fundingAmount;
      const isNegative = fee.startsWith('-');
      return {
        text: `${isNegative ? '-' : '+'}$${fee.replace(/^[+-]/u, '')}`,
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
      const { text: statusText } = transaction.order;
      const statusKey = statusText?.toLowerCase() ?? '';
      const translatedStatus = ORDER_STATUS_TO_I18N_KEY[statusKey]
        ? t(ORDER_STATUS_TO_I18N_KEY[statusKey])
        : '';
      return { text: translatedStatus, color: TextColor.TextMuted };
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
      return t('perpsStatusCompleted');
    }
    return transaction.subtitle;
  };

  const isClickable = Boolean(onClick);

  const content = (
    <>
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
      </Box>
    </>
  );

  const sharedClassName = twMerge(
    'gap-4 pt-2 pb-2 px-4 h-[62px]',
    variantStyles,
  );

  if (isClickable) {
    return (
      <ButtonBase
        className={twMerge(
          'justify-start rounded-none min-w-0 h-auto text-left cursor-pointer',
          sharedClassName,
        )}
        isFullWidth
        onClick={handleClick}
        data-testid={`transaction-card-${transaction.id}`}
      >
        {content}
      </ButtonBase>
    );
  }

  return (
    <Box
      className={sharedClassName}
      flexDirection={BoxFlexDirection.Row}
      alignItems={BoxAlignItems.Center}
      data-testid={`transaction-card-${transaction.id}`}
    >
      {content}
    </Box>
  );
};

export default TransactionCard;
