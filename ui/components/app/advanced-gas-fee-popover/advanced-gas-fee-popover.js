import React from 'react';

import { useI18nContext } from '../../../hooks/useI18nContext';
import { useTransactionModalContext } from '../../../contexts/transaction-modal';
import Box from '../../ui/box';
import Popover from '../../ui/popover';

import { AdvancedGasFeePopoverContextProvider } from './context';
import AdvancedGasFeeInputs from './advanced-gas-fee-inputs';
import AdvancedGasFeeGasLimit from './advanced-gas-fee-gas-limit';
import AdvancedGasFeeSaveButton from './advanced-gas-fee-save';
import AdvancedGasFeeDefaults from './advanced-gas-fee-defaults';

const AdvancedGasFeePopover = () => {
  const t = useI18nContext();
  const {
    closeModal,
    closeAllModals,
    currentModal,
  } = useTransactionModalContext();

  if (currentModal !== 'advancedGasFee') return null;

  return (
    <AdvancedGasFeePopoverContextProvider>
      <Popover
        className="advanced-gas-fee-popover"
        title={t('advancedGasFeeModalTitle')}
        onBack={() => closeModal('advancedGasFee')}
        onClose={closeAllModals}
        footer={<AdvancedGasFeeSaveButton />}
      >
        <Box className="advanced-gas-fee-popover__wrapper" margin={4}>
          <AdvancedGasFeeInputs />
          <div className="advanced-gas-fee-popover__separator" />
          <AdvancedGasFeeDefaults />
          <div className="advanced-gas-fee-popover__separator" />
          <AdvancedGasFeeGasLimit />
        </Box>
      </Popover>
    </AdvancedGasFeePopoverContextProvider>
  );
};

export default AdvancedGasFeePopover;
