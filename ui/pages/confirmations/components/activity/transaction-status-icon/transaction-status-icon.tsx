import React from 'react';
import { TransactionStatus } from '@metamask/transaction-controller';
import {
  Icon,
  IconName,
  IconSize,
} from '../../../../../components/component-library';
import { IconColor } from '../../../../../helpers/constants/design-system';

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
      return IconColor.successDefault;
    case TransactionStatus.failed:
    case TransactionStatus.dropped:
      return IconColor.errorDefault;
    default:
      return IconColor.warningDefault;
  }
}

// eslint-disable-next-line @typescript-eslint/naming-convention
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
