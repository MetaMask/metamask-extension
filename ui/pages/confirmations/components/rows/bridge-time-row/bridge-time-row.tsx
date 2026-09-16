import React from 'react';
import type {
  TransactionMeta,
  TransactionType,
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

const SAME_CHAIN_DURATION_SECONDS = '< 10';

const HIDE_TYPES: TransactionType[] = [];

export type BridgeTimeRowProps = {
  rowVariant?: ConfirmInfoRowSize;
  /**
   * Overrides the default "Estimated time" label. Set by the money-account
   * flows, whose designs use the shorter "Est. time".
   */
  label?: string;
};

export function BridgeTimeRow({
  rowVariant = ConfirmInfoRowSize.Default,
  label,
}: BridgeTimeRowProps) {
  const t = useI18nContext();
  const { currentConfirmation } = useConfirmContext<TransactionMeta>();
  const isLoading = useIsTransactionPayQuotePending();
  const { estimatedDuration } = useTransactionPayTotals() ?? {};
  const quotes = useTransactionPayQuotes();
  const { payToken } = useTransactionPayToken();
  const chainId = currentConfirmation?.chainId;
  const timeLabel = label ?? t('estimatedTime');

  const showEstimate =
    !hasTransactionType(currentConfirmation, HIDE_TYPES) &&
    (isLoading || Boolean(quotes?.length));

  const isSmall = rowVariant === ConfirmInfoRowSize.Small;
  const textVariant = isSmall ? TextVariant.bodyMd : TextVariant.bodyMdMedium;

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

  const isSameChain = payToken?.chainId === chainId;
  const formattedSeconds = formatSeconds(
    t,
    estimatedDuration ?? 0,
    isSameChain,
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
): string {
  if (isSameChainPayment) {
    return `${SAME_CHAIN_DURATION_SECONDS} ${t('second')}`;
  }

  if (seconds <= 30) {
    return `< 1 ${t('minute')}`;
  }

  if (seconds <= 60) {
    return `1 ${t('minute')}`;
  }

  const minutes = Math.ceil(seconds / 60);

  return `${minutes} ${t('minute')}`;
}
