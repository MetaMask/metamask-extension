import React from 'react';
import { TransactionStatus } from '@metamask/transaction-controller';
import {
  Box,
  Icon,
  IconName,
  IconSize,
  Text,
} from '../../../../../components/component-library';
import {
  AlignItems,
  Display,
  FlexDirection,
  IconColor,
  TextColor,
  TextVariant,
} from '../../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { TransactionDetailsRow } from '../transaction-details-row';
import { useTransactionDetails } from '../transaction-details-context';

function getStatusIcon(status: TransactionStatus): IconName {
  switch (status) {
    case TransactionStatus.confirmed:
      return IconName.Confirmation;
    case TransactionStatus.failed:
    case TransactionStatus.dropped:
      return IconName.Close;
    default:
      return IconName.Clock;
  }
}

function getStatusIconColor(status: TransactionStatus): IconColor {
  switch (status) {
    case TransactionStatus.confirmed:
      return IconColor.successDefault;
    case TransactionStatus.failed:
    case TransactionStatus.dropped:
      return IconColor.errorDefault;
    default:
      return IconColor.warningDefault;
  }
}

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
        <Icon
          name={getStatusIcon(status)}
          color={getStatusIconColor(status)}
          size={IconSize.Sm}
          data-testid={`status-icon-${status}`}
        />
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
