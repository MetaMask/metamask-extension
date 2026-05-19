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
import { PerpsFillTag } from '../perps-fill-tag';
import { getDisplayName } from '../utils';
import { FillType } from '../types';
import type { PerpsTransaction } from '../types';

export type TransactionCardProps = {
  transaction: PerpsTransaction;
  onClick?: (transaction: PerpsTransaction) => void;
  variant?: 'default' | 'muted';
  showTopBorder?: boolean;
  screenName?: string;
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
 * @param options0.showTopBorder
 * @param options0.screenName - Forwarded to PerpsFillTag for analytics attribution
 */
export const TransactionCard: React.FC<TransactionCardProps> = ({
  transaction,
  onClick,
  variant = 'default',
  showTopBorder = false,
  screenName,
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
    if (transaction.fill) {
      return {
        text: transaction.fill.amount,
        color: transaction.fill.isPositive
          ? TextColor.SuccessDefault
          : TextColor.ErrorDefault,
      };
    }
    if (transaction.fundingAmount) {
      return {
        text: transaction.fundingAmount.fee,
        color: transaction.fundingAmount.isPositive
          ? TextColor.SuccessDefault
          : TextColor.ErrorDefault,
      };
    }
    if (transaction.depositWithdrawal) {
      return {
        text: transaction.depositWithdrawal.amount,
        color: transaction.depositWithdrawal.isPositive
          ? TextColor.SuccessDefault
          : TextColor.ErrorDefault,
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
  const hasInteractiveBadge =
    transaction.fill?.fillType === FillType.AutoDeleveraging;

  const content = (
    <>
      <PerpsTokenLogo
        symbol={transaction.symbol}
        size={AvatarTokenSize.Md}
        className="shrink-0"
      />

      <Box
        className="min-w-0 flex-1"
        flexDirection={BoxFlexDirection.Column}
        alignItems={BoxAlignItems.Start}
        gap={1}
      >
        <Box
          flexDirection={BoxFlexDirection.Row}
          alignItems={BoxAlignItems.Center}
          gap={2}
        >
          <Text fontWeight={FontWeight.Medium}>{transaction.title}</Text>
          {!(isClickable && hasInteractiveBadge) && (
            <PerpsFillTag transaction={transaction} screenName={screenName} />
          )}
        </Box>
        <Text variant={TextVariant.BodySm} color={TextColor.TextAlternative}>
          {getSubtitleDisplay()}
        </Text>
      </Box>

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
    'gap-4 px-4 py-3',
    variantStyles,
    showTopBorder && 'border-t border-background-default',
  );

  if (isClickable && hasInteractiveBadge) {
    return (
      <Box
        flexDirection={BoxFlexDirection.Row}
        alignItems={BoxAlignItems.Center}
        className={twMerge(
          variantStyles,
          showTopBorder && 'border-t border-background-default',
        )}
        data-testid={`transaction-card-${transaction.id}`}
      >
        <ButtonBase
          className="flex-1 justify-start rounded-none min-w-0 h-auto text-left cursor-pointer gap-4 px-4 py-3 bg-transparent"
          onClick={handleClick}
        >
          {content}
        </ButtonBase>
        <Box className="pr-4 shrink-0">
          <PerpsFillTag transaction={transaction} screenName={screenName} />
        </Box>
      </Box>
    );
  }

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
