import React, { useMemo } from 'react';
import { BigNumber } from 'bignumber.js';
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
  useTransactionPayTotals,
} from '../../../hooks/pay/useTransactionPayData';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { useFiatFormatter } from '../../../../../hooks/useFiatFormatter';

// eslint-disable-next-line @typescript-eslint/naming-convention
export function TotalRow() {
  const t = useI18nContext();
  const formatFiat = useFiatFormatter();
  const isLoading = useIsTransactionPayLoading();
  const totals = useTransactionPayTotals();

  const totalUsd = useMemo(() => {
    if (!totals?.total) {
      return '';
    }

    return formatFiat(new BigNumber(totals.total.usd).toNumber());
  }, [totals, formatFiat]);

  if (isLoading) {
    return <TotalRowSkeleton />;
  }

  return (
    <Box data-testid="total-row">
      <ConfirmInfoRow label={t('total')}>
        <Text
          variant={TextVariant.bodyMd}
          color={TextColor.textAlternative}
          data-testid="total-value"
        >
          {totalUsd}
        </Text>
      </ConfirmInfoRow>
    </Box>
  );
}

// eslint-disable-next-line @typescript-eslint/naming-convention
function TotalRowSkeleton() {
  return (
    <Box
      display={Display.Flex}
      flexDirection={FlexDirection.Row}
      justifyContent={JustifyContent.spaceBetween}
      data-testid="total-row-skeleton"
    >
      <Skeleton width={80} height={20} />
      <Skeleton width={100} height={20} />
    </Box>
  );
}
