import {
  Box,
  BoxBackgroundColor,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import { TransactionMeta } from '@metamask/transaction-controller';
import React from 'react';
import { useConfirmContext } from '../../context/confirm';

export type RevertReasonSource = 'gas' | 'simulation' | 'receipt';

export type RevertReasonProps = {
  source: RevertReasonSource;
  'data-testid'?: string;
};

export function RevertReason({
  source,
  'data-testid': dataTestId = 'revert-reason',
}: RevertReasonProps) {
  const { currentConfirmation } = useConfirmContext<TransactionMeta>();
  const message = currentConfirmation?.revert?.[source]?.message;

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
