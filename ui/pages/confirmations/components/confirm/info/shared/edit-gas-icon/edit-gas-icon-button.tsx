import React, { useState, useCallback } from 'react';
import { TransactionMeta } from '@metamask/transaction-controller';
import {
  Button,
  ButtonSize,
  ButtonVariant,
  IconName,
} from '../../../../../../../components/component-library';
import { IconColor } from '../../../../../../../helpers/constants/design-system';
import { useTransactionEventFragment } from '../../../../../hooks/useTransactionEventFragment';
import { GasFeeModal } from '../../../../modals/gas-fee-modal/gas-fee-modal';
import { useConfirmContext } from '../../../../../context/confirm';

export const EditGasIconButton = (): JSX.Element => {
  const [isGasModalsVisible, setIsGasModalsVisible] = useState(false);
  const { currentConfirmation: transactionMeta } =
    useConfirmContext<TransactionMeta>();
  const { updateTransactionEventFragment } = useTransactionEventFragment();

  const openGasFeeModal = useCallback(() => {
    updateTransactionEventFragment(
      {
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        gas_edit_attempted: 'basic',
      },
      transactionMeta.id,
    );
    setIsGasModalsVisible(true);
  }, [updateTransactionEventFragment, transactionMeta.id]);

  return (
    <>
      <Button
        style={{ textDecoration: 'none' }}
        size={ButtonSize.Auto}
        variant={ButtonVariant.Link}
        startIconName={IconName.Edit}
        color={IconColor.primaryDefault}
        data-testid="edit-gas-fee-icon"
        onClick={openGasFeeModal}
      />
      {isGasModalsVisible && (
        <GasFeeModal setGasModalVisible={setIsGasModalsVisible} />
      )}
    </>
  );
};
