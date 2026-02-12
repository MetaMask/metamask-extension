import React from 'react';
import { Text, TextVariant, TextColor } from '@metamask/design-system-react';
import { TransactionStatus } from '@metamask/transaction-controller';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { Row } from '.';

type Props = {
  status: TransactionStatus;
};

export const StatusRow = ({ status }: Props) => {
  const t = useI18nContext();
  const isConfirmed = status === TransactionStatus.confirmed;
  return (
    <Row
      left={t('status')}
      right={
        <Text
          variant={TextVariant.BodySm}
          color={
            isConfirmed ? TextColor.SuccessDefault : TextColor.ErrorDefault
          }
        >
          {isConfirmed ? t('confirmed') : t('failed')}
        </Text>
      }
    />
  );
};
