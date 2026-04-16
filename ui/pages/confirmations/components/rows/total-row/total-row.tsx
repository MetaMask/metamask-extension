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
import { ConfirmInfoRowText } from '../../../../../components/app/confirm/info/row/text';
import {
  useIsTransactionPayLoading,
  useTransactionPayTotals,
} from '../../../hooks/pay/useTransactionPayData';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { useFiatFormatter } from '../../../../../hooks/useFiatFormatter';

export type TotalRowProps = {
  variant?: ConfirmInfoRowSize;
};

// eslint-disable-next-line @typescript-eslint/naming-convention
export function TotalRow({
  variant = ConfirmInfoRowSize.Default,
}: TotalRowProps) {
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

  const isSmall = variant === ConfirmInfoRowSize.Small;
  const textVariant = isSmall ? TextVariant.bodyMd : TextVariant.bodyMdMedium;

  if (isLoading) {
    return (
      <Box data-testid="total-row-skeleton">
        <ConfirmInfoRowSkeleton label={t('total')} rowVariant={variant} />
      </Box>
    );
  }

  return (
    <Box data-testid="total-row">
      <ConfirmInfoRow label={t('total')} rowVariant={variant}>
        {isSmall ? (
          <Text
            variant={textVariant}
            color={TextColor.textAlternative}
            data-testid="total-value"
          >
            {totalUsd}
          </Text>
        ) : (
          <ConfirmInfoRowText text={totalUsd} data-testid="total-value" />
        )}
      </ConfirmInfoRow>
    </Box>
  );
}
