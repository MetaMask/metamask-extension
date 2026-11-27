import React from 'react';
import {
  TransactionType,
  type TransactionMeta,
} from '@metamask/transaction-controller';
import { Text } from '../../../../../components/component-library';
import {
  TextColor,
  TextVariant,
} from '../../../../../helpers/constants/design-system';
import {
  ConfirmInfoRow,
  ConfirmInfoRowSize,
  ConfirmInfoRowSkeleton,
} from '../../../../../components/app/confirm/info/row/row';
import {
  useIsTransactionPayQuotePending,
  useTransactionPayQuotes,
  useTransactionPayTotals,
} from '../../../hooks/pay/useTransactionPayData';
import { useTransactionPayToken } from '../../../hooks/pay/useTransactionPayToken';
import { useConfirmContext } from '../../../context/confirm';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { hasTransactionType } from '../../../../../../shared/lib/transactions.utils';
import { getPaymentTokenChainId } from '../../../../../../shared/lib/transaction/pay-token';

const SAME_CHAIN_DURATION_SECONDS = '< 10';

const COMPACT_TIME_LABEL_TRANSACTION_TYPES: TransactionType[] = [
  TransactionType.moneyAccountDeposit,
];

const HIDE_TYPES: TransactionType[] = [];

export type BridgeTimeRowProps = {
  rowVariant?: ConfirmInfoRowSize;
};

export function BridgeTimeRow({
  rowVariant = ConfirmInfoRowSize.Default,
}: BridgeTimeRowProps) {
  const t = useI18nContext();
  const { currentConfirmation } = useConfirmContext<TransactionMeta>();
  const isLoading = useIsTransactionPayQuotePending();
  const { estimatedDuration } = useTransactionPayTotals() ?? {};
  const quotes = useTransactionPayQuotes();
  const { payToken } = useTransactionPayToken();
  const chainId = currentConfirmation?.chainId;

  const showEstimate =
    !hasTransactionType(currentConfirmation, HIDE_TYPES) &&
    (isLoading || Boolean(quotes?.length));
  const useCompactCopy = hasTransactionType(
    currentConfirmation,
    COMPACT_TIME_LABEL_TRANSACTION_TYPES,
  );

  const isSmall = rowVariant === ConfirmInfoRowSize.Small;
  const textVariant = isSmall ? TextVariant.bodyMd : TextVariant.bodyMdMedium;
  const timeLabel = useCompactCopy
    ? t('moneyAccountDepositEstTime')
    : t('estimatedTime');

  if (!showEstimate) {
    return null;
  }

  if (isLoading) {
    return (
      <ConfirmInfoRowSkeleton
        data-testid="bridge-time-row-skeleton"
        label={timeLabel}
        rowVariant={rowVariant}
      />
    );
  }

  const isSameChain =
    payToken !== undefined && getPaymentTokenChainId(payToken) === chainId;
  const formattedSeconds = formatSeconds(
    t,
    estimatedDuration ?? 0,
    isSameChain,
    useCompactCopy,
  );

  return (
    <ConfirmInfoRow
      data-testid="bridge-time-row"
      label={timeLabel}
      rowVariant={rowVariant}
    >
      <Text
        variant={textVariant}
        color={TextColor.textAlternative}
        data-testid="bridge-time-value"
      >
        {formattedSeconds}
      </Text>
    </ConfirmInfoRow>
  );
}

function formatSeconds(
  t: ReturnType<typeof useI18nContext>,
  seconds: number,
  isSameChainPayment: boolean,
  useCompactCopy: boolean,
): string {
  if (isSameChainPayment) {
    return `${SAME_CHAIN_DURATION_SECONDS} ${t('second')}`;
  }

  if (seconds <= 30) {
    return useCompactCopy
      ? t('moneyAccountDepositLessThanOneMinute')
      : `< 1 ${t('minute')}`;
  }

  if (seconds <= 60) {
    return `1 ${t('minute')}`;
  }

  const minutes = Math.ceil(seconds / 60);

  return `${minutes} ${t('minute')}`;
}
