import React, { Dispatch, SetStateAction } from 'react';
import {
  Button,
  ButtonSize,
  ButtonVariant,
  IconName,
} from '../../../../../../../components/component-library';
import { useTransactionModalContext } from '../../../../../../../contexts/transaction-modal';
import { IconColor } from '../../../../../../../helpers/constants/design-system';
import { useTransactionEventFragment } from '../../../../../hooks/useTransactionEventFragment';

export const EditGasIconButton = ({
  supportsEIP1559,
  setShowCustomizeGasPopover,
}: {
  supportsEIP1559: boolean;
  setShowCustomizeGasPopover: Dispatch<SetStateAction<boolean>>;
}) => {
  const { openModal } = useTransactionModalContext() as {
    openModal: (modalId: string) => void;
  };
  const { updateTransactionEventFragment } = useTransactionEventFragment();

  const openEditEIP1559TxGasFeeModal = () => {
    updateTransactionEventFragment({
      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
      // eslint-disable-next-line @typescript-eslint/naming-convention
      gas_edit_attempted: 'basic',
    });
    openModal('editGasFee');
  };

  const openEditGasFeeLegacyTxModal = () => {
    setShowCustomizeGasPopover(true);
  };

  const openEditGasFeeModal = () =>
    supportsEIP1559
      ? openEditEIP1559TxGasFeeModal()
      : openEditGasFeeLegacyTxModal();

  return (
    <Button
      style={{ textDecoration: 'none' }}
      size={ButtonSize.Auto}
      variant={ButtonVariant.Link}
      startIconName={IconName.Edit}
      color={IconColor.primaryDefault}
      data-testid="edit-gas-fee-icon"
      onClick={openEditGasFeeModal}
    />
  );
};
