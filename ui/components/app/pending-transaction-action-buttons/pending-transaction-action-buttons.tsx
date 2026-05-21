import React from 'react';
import type { TransactionMeta } from '@metamask/transaction-controller';
import { Button, ButtonSize } from '@metamask/design-system-react';
import { Box } from '../../component-library';
import CancelButton from '../cancel-button';
import { useI18nContext } from '../../../hooks/useI18nContext';
import type { PendingTransactionSpeedUpLabel } from '../../../helpers/transactions/pending-transaction-actions';

type PendingTransactionActionButtonsProps = {
  showCancel: boolean;
  showSpeedUp: boolean;
  speedUpLabel: PendingTransactionSpeedUpLabel;
  onCancel: (event: React.MouseEvent) => void;
  onSpeedUp: (event: React.MouseEvent) => void;
  primaryTransaction: TransactionMeta;
};

// Cancel / Speed up buttons for pending EVM activity rows
export const PendingTransactionActionButtons = ({
  showCancel,
  showSpeedUp,
  speedUpLabel,
  onCancel,
  onSpeedUp,
  primaryTransaction,
}: Readonly<PendingTransactionActionButtonsProps>) => {
  const t = useI18nContext();

  if (!showCancel && !showSpeedUp) {
    return null;
  }

  return (
    <Box
      paddingTop={2}
      className="flex gap-2"
      onClick={(event: React.MouseEvent) => {
        event.stopPropagation();
      }}
    >
      {showCancel ? (
        <CancelButton
          data-testid="cancel-button"
          size={ButtonSize.Sm}
          transaction={primaryTransaction}
          cancelTransaction={onCancel}
        />
      ) : null}
      {showSpeedUp ? (
        <Button
          data-testid="speed-up-button"
          className="whitespace-nowrap"
          size={ButtonSize.Sm}
          onClick={onSpeedUp}
        >
          {t(speedUpLabel)}
        </Button>
      ) : null}
    </Box>
  );
};
