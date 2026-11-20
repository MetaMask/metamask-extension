import React from 'react';
import { TransactionStatus } from '@metamask/transaction-controller';
import {
  Icon,
  IconColor,
  IconName,
  IconSize,
} from '@metamask/design-system-react';

type TransactionStatusIconProps = {
  status: TransactionStatus;
};

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
      return IconColor.SuccessDefault;
    case TransactionStatus.failed:
    case TransactionStatus.dropped:
      return IconColor.ErrorDefault;
    default:
      return IconColor.WarningDefault;
  }
}

export function TransactionStatusIcon({ status }: TransactionStatusIconProps) {
  return (
    <Icon
      name={getStatusIcon(status)}
      color={getStatusIconColor(status)}
      size={IconSize.Sm}
      data-testid={`transaction-status-icon-${status}`}
    />
  );
}
