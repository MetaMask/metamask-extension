import React from 'react';

import Box from '../../../ui/box';
import BaseFeeInput from './base-fee-input';
import PriorityFeeInput from './priorityfee-input';

const AdvancedGasFeeInputs = () => {
  return (
    <Box className="advanced-gas-fee-inputs" margin={4}>
      <BaseFeeInput />
      <div className="advanced-gas-fee-input__separator" />
      <PriorityFeeInput />
    </Box>
  );
};

export default AdvancedGasFeeInputs;
