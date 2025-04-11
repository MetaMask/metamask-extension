import React from 'react';

import Box from '../../../../components/ui/box';
import Popover from '../../../../components/ui/popover';
import { useTransactionModalContext } from '../../../../contexts/transaction-modal';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import AdvancedGasFeeDefaults from './advanced-gas-fee-defaults';
import AdvancedGasFeeGasLimit from './advanced-gas-fee-gas-limit';
import AdvancedGasFeeInputs from './advanced-gas-fee-inputs';
import AdvancedGasFeeSaveButton from './advanced-gas-fee-save';
import { AdvancedGasFeePopoverContextProvider } from './context';

const AdvancedGasFeePopover = () => {
  const t = useI18nContext();
  const { closeAllModals, currentModal } = useTransactionModalContext();

  if (currentModal !== 'advancedGasFee') {
    return null;
  }

  return (
    <AdvancedGasFeePopoverContextProvider>
      <Popover
        className="advanced-gas-fee-popover"
        title={t('advancedGasFeeModalTitle')}
        onClose={closeAllModals}
        footer={<AdvancedGasFeeSaveButton />}
      >
        <Box margin={4}>
          <AdvancedGasFeeInputs />
          <AdvancedGasFeeDefaults />
          <AdvancedGasFeeGasLimit />
        </Box>
      </Popover>
    </AdvancedGasFeePopoverContextProvider>
  );
};

export default AdvancedGasFeePopover;
