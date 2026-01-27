import React from 'react';
import { Box, Text } from '../../../../../components/component-library';
import {
  Display,
  FlexDirection,
  TextColor,
  TextVariant,
} from '../../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { TransactionDetailsRow } from '../transaction-details-row';
import { useTransactionDetails } from '../transaction-details-context';
import { formatTransactionDateTime } from '../utils';

// eslint-disable-next-line @typescript-eslint/naming-convention
export function TransactionDetailsDateRow() {
  const t = useI18nContext();
  const { transactionMeta } = useTransactionDetails();

  const { time, date } = formatTransactionDateTime(transactionMeta.time);

  return (
    <TransactionDetailsRow
      label={t('date')}
      data-testid="transaction-details-date-row"
    >
      <Box display={Display.Flex} flexDirection={FlexDirection.Row} gap={1}>
        <Text variant={TextVariant.bodyMd} color={TextColor.textAlternative}>
          {time},
        </Text>
        <Text variant={TextVariant.bodyMd}>{date}</Text>
      </Box>
    </TransactionDetailsRow>
  );
}
