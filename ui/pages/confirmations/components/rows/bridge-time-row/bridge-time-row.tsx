import React from 'react';
import type {
  TransactionMeta,
  TransactionType,
} from '@metamask/transaction-controller';
import { Box, Text } from '../../../../../components/component-library';
import { Skeleton } from '../../../../../components/component-library/skeleton';
import {
  Display,
  FlexDirection,
  JustifyContent,
  TextColor,
  TextVariant,
} from '../../../../../helpers/constants/design-system';
import { ConfirmInfoRow } from '../../../../../components/app/confirm/info/row/row';
import {
  useIsTransactionPayLoading,
  useTransactionPayQuotes,
  useTransactionPayTotals,
} from '../../../hooks/pay/useTransactionPayData';
import { useTransactionPayToken } from '../../../hooks/pay/useTransactionPayToken';
import { useConfirmContext } from '../../../context/confirm';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { hasTransactionType } from '../../../utils/transaction-pay';

const SAME_CHAIN_DURATION_SECONDS = '< 10';

const HIDE_TYPES: TransactionType[] = [];

// eslint-disable-next-line @typescript-eslint/naming-convention
export function BridgeTimeRow() {
  const t = useI18nContext();
  const { currentConfirmation } = useConfirmContext<TransactionMeta>();
  const isLoading = useIsTransactionPayLoading();
  const { estimatedDuration } = useTransactionPayTotals() ?? {};
  const quotes = useTransactionPayQuotes();
  const { payToken } = useTransactionPayToken();
  const chainId = currentConfirmation?.chainId;

  const showEstimate =
    !hasTransactionType(currentConfirmation, HIDE_TYPES) &&
    (isLoading || Boolean(quotes?.length));

  if (!showEstimate) {
    return null;
  }

  if (isLoading) {
    return <BridgeTimeRowSkeleton />;
  }

  const isSameChain = payToken?.chainId === chainId;
  const formattedSeconds = formatSeconds(
    t,
    estimatedDuration ?? 0,
    isSameChain,
  );

  return (
    <ConfirmInfoRow data-testid="bridge-time-row" label={t('estimatedTime')}>
      <Text
        variant={TextVariant.bodyMd}
        color={TextColor.textAlternative}
        data-testid="bridge-time-value"
      >
        {formattedSeconds}
      </Text>
    </ConfirmInfoRow>
  );
}

// eslint-disable-next-line @typescript-eslint/naming-convention
function BridgeTimeRowSkeleton() {
  return (
    <Box
      display={Display.Flex}
      flexDirection={FlexDirection.Row}
      justifyContent={JustifyContent.spaceBetween}
      data-testid="bridge-time-row-skeleton"
    >
      <Skeleton width={100} height={20} />
      <Skeleton width={60} height={20} />
    </Box>
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
