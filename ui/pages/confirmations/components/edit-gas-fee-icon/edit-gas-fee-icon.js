import React from 'react';
import PropTypes from 'prop-types';

import { useGasFeeContext } from '../../../../contexts/gasFee';
import { useTransactionEventFragment } from '../../hooks/useTransactionEventFragment';
import { useTransactionModalContext } from '../../../../contexts/transaction-modal';
import {
  BUTTON_VARIANT,
  Button,
  IconName,
} from '../../../../components/component-library';
import { IconColor, Size } from '../../../../helpers/constants/design-system';

export default function EditGasFeeIcon({ userAcknowledgedGasMissing = false }) {
  const { hasSimulationError, estimateUsed, supportsEIP1559 } =
    useGasFeeContext();
  const { updateTransactionEventFragment } = useTransactionEventFragment();
  const { openModal } = useTransactionModalContext();
  const editEnabled = !hasSimulationError || userAcknowledgedGasMissing;

  if (!supportsEIP1559 || !estimateUsed || !editEnabled) {
    return null;
  }

  const openEditGasFeeModal = () => {
    updateTransactionEventFragment({
      gas_edit_attempted: 'basic',
    });
    openModal('editGasFee');
  };

  return (
    <Button
      style={{ textDecoration: 'none' }}
      size={Size.SM}
      variant={BUTTON_VARIANT.LINK}
      startIconName={IconName.Edit}
      color={IconColor.primaryDefault}
      data-testid="edit-gas-fee-icon"
      onClick={openEditGasFeeModal}
    />
  );
}

EditGasFeeIcon.propTypes = {
  userAcknowledgedGasMissing: PropTypes.bool,
};
