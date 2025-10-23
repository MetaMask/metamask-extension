import React from 'react';

import { Box } from '@metamask/design-system-react';
import BaseFeeInput from './base-fee-input';
import PriorityFeeInput from './priority-fee-input';

const AdvancedGasFeeInputs = () => {
  return (
    <Box className="advanced-gas-fee-inputs">
      <BaseFeeInput />
      <PriorityFeeInput />
    </Box>
  );
};

export default AdvancedGasFeeInputs;
