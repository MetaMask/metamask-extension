import React, { useMemo } from 'react';
import { BigNumber } from 'bignumber.js';
import { Box, Text } from '../../../../../components/component-library';
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
    return <ConfirmInfoRowSkeleton data-testid="total-row-skeleton" />;
  }

  return (
    <Box data-testid="total-row">
      <ConfirmInfoRow label={t('total')} rowVariant={ConfirmInfoRowSize.Small}>
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
