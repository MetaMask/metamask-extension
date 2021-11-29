import React from 'react';

import Box from '../../../ui/box';
import BasefeeInput from './basefee-input';
import PriorityFeeInput from './priorityfee-input';

const AdvancedGasFeeInputs = () => {
  return (
    <Box className="advanced-gas-fee-input" margin={4}>
      <BasefeeInput />
      <div className="advanced-gas-fee-input__separator" />
      <PriorityFeeInput />
    </Box>
  );
};

export default AdvancedGasFeeInputs;
