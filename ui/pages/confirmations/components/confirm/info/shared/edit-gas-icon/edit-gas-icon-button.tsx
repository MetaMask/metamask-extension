import React, { useCallback } from 'react';
import { TransactionMeta } from '@metamask/transaction-controller';
import {
  Button,
  ButtonSize,
  ButtonVariant,
  IconName,
} from '../../../../../../../components/component-library';
import { IconColor } from '../../../../../../../helpers/constants/design-system';
import { useTransactionEventFragment } from '../../../../../hooks/useTransactionEventFragment';
import { useConfirmContext } from '../../../../../context/confirm';
import { useGasFeeModalContext } from '../../../../../context/gas-fee-modal';

export const EditGasIconButton = (): JSX.Element => {
  const { currentConfirmation: transactionMeta } =
    useConfirmContext<TransactionMeta>();
  const { updateTransactionEventFragment } = useTransactionEventFragment();
  const { openGasFeeModal } = useGasFeeModalContext();

  const handleOpenGasFeeModal = useCallback(() => {
    updateTransactionEventFragment(
      {
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        gas_edit_attempted: 'basic',
      },
      transactionMeta.id,
    );
    openGasFeeModal();
  }, [updateTransactionEventFragment, transactionMeta.id, openGasFeeModal]);

  return (
    <Button
      style={{ textDecoration: 'none' }}
      size={ButtonSize.Auto}
      variant={ButtonVariant.Link}
      startIconName={IconName.Edit}
      color={IconColor.primaryDefault}
      data-testid="edit-gas-fee-icon"
      onClick={handleOpenGasFeeModal}
    />
  );
};
