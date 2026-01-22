import React from 'react';
import { TransactionStatus } from '@metamask/transaction-controller';
import { Box, Text } from '../../../../../components/component-library';
import {
  AlignItems,
  Display,
  FlexDirection,
  TextColor,
  TextVariant,
} from '../../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { TransactionDetailsRow } from '../transaction-details-row';
import { useTransactionDetails } from '../transaction-details-context';
import { TransactionStatusIcon } from '../transaction-status-icon';

function getStatusTextColor(status: TransactionStatus): TextColor {
  switch (status) {
    case TransactionStatus.confirmed:
      return TextColor.successDefault;
    case TransactionStatus.failed:
    case TransactionStatus.dropped:
      return TextColor.errorDefault;
    default:
      return TextColor.warningDefault;
  }
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export function TransactionDetailsStatusRow() {
  const t = useI18nContext();
  const { transactionMeta } = useTransactionDetails();
  const { status } = transactionMeta;

  const getStatusText = (txStatus: TransactionStatus): string => {
    switch (txStatus) {
      case TransactionStatus.confirmed:
        return t('confirmed');
      case TransactionStatus.failed:
      case TransactionStatus.dropped:
        return t('failed');
      default:
        return t('pending');
    }
  };

  return (
    <TransactionDetailsRow
      label={t('status')}
      data-testid="transaction-details-status-row"
    >
      <Box
        display={Display.Flex}
        flexDirection={FlexDirection.Row}
        alignItems={AlignItems.center}
        gap={1}
      >
        <TransactionStatusIcon status={status} />
        <Text
          variant={TextVariant.bodyMdMedium}
          color={getStatusTextColor(status)}
        >
          {getStatusText(status)}
        </Text>
      </Box>
    </TransactionDetailsRow>
  );
}
