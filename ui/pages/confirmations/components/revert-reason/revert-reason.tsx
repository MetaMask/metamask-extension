import {
  Box,
  BoxBackgroundColor,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import React from 'react';
import { useTransactionMetadataRequest } from '../../hooks/transactions/useTransactionMetadataRequest';

export type RevertReasonSource = 'gas' | 'simulation' | 'receipt';

export type RevertReasonProps = {
  readonly source: RevertReasonSource;
  readonly 'data-testid'?: string;
};

export function RevertReason({
  source,
  'data-testid': dataTestId = 'revert-reason',
}: RevertReasonProps) {
  const transaction = useTransactionMetadataRequest();
  const message = transaction.revert?.[source]?.message;

  if (!message) {
    return null;
  }

  return (
    <Box
      backgroundColor={BoxBackgroundColor.BackgroundMuted}
      padding={2}
      className="rounded"
      data-testid={dataTestId}
    >
      <Text
        variant={TextVariant.BodySm}
        color={TextColor.TextAlternative}
        className="font-mono break-words"
        data-testid={`${dataTestId}-message`}
      >
        {message}
      </Text>
    </Box>
  );
}
