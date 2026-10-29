import React, { useCallback } from 'react';
import { TransactionMeta } from '@metamask/transaction-controller';
import {
  ButtonIcon,
  ButtonIconSize,
  IconName,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../../../../../../hooks/useI18nContext';
import { useTransactionEventFragment } from '../../../../../hooks/useTransactionEventFragment';
import { useConfirmContext } from '../../../../../context/confirm';
import { useGasFeeModalContext } from '../../../../../context/gas-fee-modal';

export const EditGasIconButton = (): JSX.Element => {
  const t = useI18nContext();
  const { currentConfirmation: transactionMeta } =
    useConfirmContext<TransactionMeta>();
  const { updateTransactionEventFragment } = useTransactionEventFragment();
  const { openGasFeeModal } = useGasFeeModalContext();

  const handleOpenGasFeeModal = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      updateTransactionEventFragment(
        {
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          gas_edit_attempted: 'basic',
        },
        transactionMeta.id,
      );
      openGasFeeModal();
    },
    [updateTransactionEventFragment, transactionMeta.id, openGasFeeModal],
  );

  return (
    <ButtonIcon
      iconName={IconName.Edit}
      size={ButtonIconSize.Sm}
      ariaLabel={t('edit')}
      data-testid="edit-gas-fee-icon"
      onClick={handleOpenGasFeeModal}
    />
  );
};
