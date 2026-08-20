import React from 'react';
import clsx from 'clsx';
import { Box, Button, ButtonSize } from '@metamask/design-system-react';
import CancelButton from '../cancel-button';
import { useI18nContext } from '../../../hooks/useI18nContext';
import type { PendingTransactionSpeedUpAction } from '../../../hooks/usePendingTransactionActions';

type PendingTransactionActionButtonsProps = {
  showCancel: boolean;
  onCancel: (event: React.MouseEvent) => void;
  speedUp: PendingTransactionSpeedUpAction;
  className?: string;
};

export const PendingTransactionActionButtons = ({
  showCancel,
  onCancel,
  speedUp,
  className,
}: Readonly<PendingTransactionActionButtonsProps>) => {
  const t = useI18nContext();

  if (!showCancel && !speedUp.show) {
    return null;
  }

  return (
    <Box
      className={clsx('flex gap-2 pt-2', className)}
      onClick={(event: React.MouseEvent) => {
        event.stopPropagation();
      }}
    >
      {showCancel ? (
        <CancelButton
          data-testid="cancel-button"
          size={ButtonSize.Sm}
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
