import React from 'react';

import Box from '../../../ui/box';
import AdvancedGasFeeInputBaseFee from './advanced-gas-fee-inputs-basefee';
import AdvancedGasFeeInputPriorityFee from './advanced-gas-fee-inputs-priorityfee';

const AdvancedGasFeeInputs = () => {
  return (
    <Box className="advanced-gas-fee-input" margin={4}>
      <AdvancedGasFeeInputBaseFee />
      <div className="advanced-gas-fee-input__separator" />
      <AdvancedGasFeeInputPriorityFee />
    </Box>
  );
};

export default AdvancedGasFeeInputs;
