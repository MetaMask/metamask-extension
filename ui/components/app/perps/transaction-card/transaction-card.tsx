import React, { useCallback } from 'react';
import {
  twMerge,
  AvatarTokenSize,
  Box,
  BoxAlignItems,
  BoxFlexDirection,
  ContentVariant,
  ListItem,
  TextColor,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { PerpsTokenLogo } from '../perps-token-logo';
import { PerpsFillTag } from '../perps-fill-tag';
import { getDisplaySymbol } from '../utils';
import { getOrderStatusI18nKey } from '../utils/orderUtils';
import { FillType } from '../types';
import type { PerpsTransaction } from '../types';

export type TransactionCardProps = {
  transaction: PerpsTransaction;
  onClick?: (transaction: PerpsTransaction) => void;
  variant?: 'default' | 'muted';
  showTopBorder?: boolean;
  screenName?: string;
};

// `bridging` is treated the same as `pending` for display purposes — the
// wallet doesn't currently emit a distinct in-progress-bridge state, but the
// depositWithdrawal.status type supports it for other request-based sources.
const DEPOSIT_WITHDRAWAL_STATUS_TO_I18N_KEY: Record<string, string> = {
  completed: 'perpsStatusCompleted',
  pending: 'perpsStatusPending',
  bridging: 'perpsStatusPending',
  failed: 'perpsStatusFailed',
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
export const TransactionCard = ({
  transaction,
  onClick,
  variant = 'default',
  showTopBorder = false,
  screenName,
}: TransactionCardProps) => {
  const t = useI18nContext();
  const displayName = getDisplaySymbol(transaction.symbol);

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
      if (transaction.fill.amountNumber === undefined) {
        return {
          text: transaction.fill.amount,
          color: TextColor.TextAlternative,
        };
      }
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
      const translatedStatus = t(getOrderStatusI18nKey(transaction.order.text));
      return { text: translatedStatus, color: TextColor.TextMuted };
    }
    return { text: displayName, color: TextColor.TextDefault };
  };

  const amountDisplay = getAmountDisplay();

  // Construct title display based on transaction type. Deposit/withdrawal
  // titles are rendered directly (unlike the subtitle, there's no other
  // override downstream), so the verb and empty-state text must be
  // translated here rather than left as the transform's deterministic
  // English string.
  const getTitleDisplay = (): string => {
    if (
      (transaction.type === 'deposit' || transaction.type === 'withdrawal') &&
      transaction.depositWithdrawal
    ) {
      const isDeposit = transaction.type === 'deposit';
      const magnitude = Math.abs(transaction.depositWithdrawal.amountNumber);
      if (magnitude === 0) {
        return t(
          isDeposit ? 'perpsDepositEmptyTitle' : 'perpsWithdrawalEmptyTitle',
        );
      }
      const verb = t(isDeposit ? 'perpsDepositedVerb' : 'perpsWithdrewVerb');
      return `${verb} ${magnitude.toFixed(2)} ${transaction.depositWithdrawal.asset}`;
    }
    return transaction.title;
  };

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
    // For deposits/withdrawals, show the transaction's real status (e.g. a
    // wallet-tracked deposit/withdrawal may still be pending or have failed)
    // instead of always displaying "Completed".
    if (transaction.type === 'deposit' || transaction.type === 'withdrawal') {
      const status = transaction.depositWithdrawal?.status ?? 'completed';
      const i18nKey =
        DEPOSIT_WITHDRAWAL_STATUS_TO_I18N_KEY[status] ?? 'perpsStatusCompleted';
      return t(i18nKey);
    }
    return transaction.subtitle;
  };

  const isClickable = Boolean(onClick);
  const hasInteractiveBadge =
    transaction.fill?.fillType === FillType.AutoDeleveraging;

  const listItem = (
    <ListItem
      variant={ContentVariant.TwoLines}
      isInteractive={isClickable}
      onClick={isClickable ? handleClick : undefined}
      className={
        isClickable && hasInteractiveBadge
          ? 'min-w-0 flex-1'
          : twMerge(
              '[container-name:list-item] [container-type:inline-size]',
              variantStyles,
              showTopBorder && 'border-t border-background-default',
            )
      }
      data-testid={`transaction-card-${transaction.id}`}
      avatar={
        <PerpsTokenLogo
          symbol={transaction.symbol}
          size={AvatarTokenSize.Md}
          className="shrink-0"
        />
      }
      title={getTitleDisplay()}
      titleProps={{ className: 'text-s-body-md @compact:text-s-body-sm' }}
      titleEndAccessory={
        isClickable && hasInteractiveBadge ? undefined : (
          <PerpsFillTag transaction={transaction} screenName={screenName} />
        )
      }
      description={getSubtitleDisplay()}
      value={amountDisplay.text}
      valueProps={{
        color: amountDisplay.color,
        className: 'text-s-body-md @compact:text-s-body-sm text-right',
      }}
    />
  );

  if (isClickable && hasInteractiveBadge) {
    // The ADL badge is its own control (it opens the support article), so it
    // stays outside the interactive row: a button nested inside the row's
    // role="button" is invalid, and the row's Enter/Space handling would
    // otherwise also fire the row click when the badge is keyboard-activated.
    return (
      <Box
        flexDirection={BoxFlexDirection.Row}
        alignItems={BoxAlignItems.Center}
        className={twMerge(
          '[container-name:list-item] [container-type:inline-size]',
          variantStyles,
          showTopBorder && 'border-t border-background-default',
        )}
      >
        {listItem}
        <Box className="pr-4 shrink-0">
          <PerpsFillTag transaction={transaction} screenName={screenName} />
        </Box>
      </Box>
    );
  }

  return listItem;
};

export default TransactionCard;
