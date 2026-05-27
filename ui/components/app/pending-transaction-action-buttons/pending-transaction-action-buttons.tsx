import React from 'react';
import type { TransactionMeta } from '@metamask/transaction-controller';
import { Box, Button, ButtonSize } from '@metamask/design-system-react';
import CancelButton from '../cancel-button';
import { useI18nContext } from '../../../hooks/useI18nContext';
import type { PendingTransactionSpeedUpAction } from '../../../hooks/usePendingTransactionActions';

type PendingTransactionActionButtonsProps = {
  showCancel: boolean;
  onCancel: (event: React.MouseEvent) => void;
  speedUp: PendingTransactionSpeedUpAction;
  primaryTransaction: TransactionMeta;
};

// Cancel / Speed up buttons for pending EVM activity rows
export const PendingTransactionActionButtons = ({
  showCancel,
  onCancel,
  speedUp,
  primaryTransaction,
}: Readonly<PendingTransactionActionButtonsProps>) => {
  const t = useI18nContext();

  if (!showCancel && !speedUp.show) {
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
      {speedUp.show ? (
        <Button
          data-testid="speed-up-button"
          className="whitespace-nowrap"
          size={ButtonSize.Sm}
          onClick={speedUp.onClick}
        >
          {t(speedUp.label)}
        </Button>
      ) : null}
    </Box>
  );
};
