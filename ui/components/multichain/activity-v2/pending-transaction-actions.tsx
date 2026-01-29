import React, { useCallback } from 'react';
import { Box, Button, ButtonSize } from '@metamask/design-system-react';
import { TransactionMeta } from '@metamask/transaction-controller';
import CancelButton from '../../app/cancel-button';
import { useShouldShowSpeedUp } from '../../../hooks/useShouldShowSpeedUp';
import { useTransactionModalContext } from '../../../contexts/transaction-modal';

type Props = {
  transaction: TransactionMeta;
  isEarliestNonce: boolean;
};

export const PendingTransactionActions = ({
  transaction,
  isEarliestNonce,
}: Props) => {
  const { openModal } = useTransactionModalContext();

  // Determine if speed up should be shown (after 5 seconds)
  const transactionGroup = {
    transactions: [transaction],
    hasRetried: false, // TODO: Track retry status
  };
  const shouldShowSpeedUp = useShouldShowSpeedUp(
    transactionGroup,
    isEarliestNonce,
  );

  const handleSpeedUp = useCallback(
    (event: React.MouseEvent) => {
      event.stopPropagation();
      openModal('cancelSpeedUpTransaction');
    },
    [openModal],
  );

  const handleCancel = useCallback(
    (event: React.MouseEvent) => {
      event.stopPropagation();
      openModal('cancelSpeedUpTransaction');
    },
    [openModal],
  );

  return (
    <Box className="flex gap-2 mt-2">
      <CancelButton
        data-testid="cancel-button"
        size={ButtonSize.Sm}
        transaction={transaction}
        cancelTransaction={handleCancel}
      />
      {shouldShowSpeedUp && (
        <Button size={ButtonSize.Sm} onClick={handleSpeedUp}>
          Speed Up
        </Button>
      )}
    </Box>
  );
};
