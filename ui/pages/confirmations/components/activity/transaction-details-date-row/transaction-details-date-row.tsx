import React from 'react';
import { Box, BoxFlexDirection } from '@metamask/design-system-react';
import { Text } from '../../../../../components/component-library';
import {
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
      <Box className="flex" flexDirection={BoxFlexDirection.Row} gap={1}>
        <Text variant={TextVariant.bodyMd} color={TextColor.textAlternative}>
          {time},
        </Text>
        <Text variant={TextVariant.bodyMd}>{date}</Text>
      </Box>
    </TransactionDetailsRow>
  );
}
