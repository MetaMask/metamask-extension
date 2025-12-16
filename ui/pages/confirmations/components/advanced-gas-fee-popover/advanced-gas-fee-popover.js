import PropTypes from 'prop-types';
import React from 'react';

import { useI18nContext } from '../../../../hooks/useI18nContext';
import { useTransactionModalContext } from '../../../../contexts/transaction-modal';
import Box from '../../../../components/ui/box';
import Popover from '../../../../components/ui/popover';
import { GasFeeContextProvider } from '../../../../contexts/gasFee';

import { AdvancedGasFeePopoverContextProvider } from './context';
import AdvancedGasFeeInputs from './advanced-gas-fee-inputs';
import AdvancedGasFeeGasLimit from './advanced-gas-fee-gas-limit';
import AdvancedGasFeeSaveButton from './advanced-gas-fee-save';
import AdvancedGasFeeDefaults from './advanced-gas-fee-defaults';

const AdvancedGasFeePopover = ({ transaction, editGasMode }) => {
  const t = useI18nContext();
  const { closeAllModals, currentModal } = useTransactionModalContext();

  if (currentModal !== 'advancedGasFee') {
    return null;
  }

  return (
    <GasFeeContextProvider transaction={transaction} editGasMode={editGasMode}>
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
    </GasFeeContextProvider>
  );
};

AdvancedGasFeePopover.propTypes = {
  transaction: PropTypes.object.isRequired,
  editGasMode: PropTypes.string,
};

export default AdvancedGasFeePopover;
