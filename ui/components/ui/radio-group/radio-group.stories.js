import React from 'react';
import { GAS_RECOMMENDATIONS } from '../../../../shared/constants/gas';
import RadioGroup from '.';

export default {
  title: 'RadioGroup',
  id: __filename,
};

export const radioGroup = () => {
  return (
    <div className="radio-group" style={{ minWidth: '600px' }}>
      <RadioGroup
        name="gas-recommendation"
        options={[
          { value: GAS_RECOMMENDATIONS.LOW, label: 'Low', recommended: false },
          {
            value: GAS_RECOMMENDATIONS.MEDIUM,
            label: 'Medium',
            recommended: false,
          },
          { value: GAS_RECOMMENDATIONS.HIGH, label: 'High', recommended: true },
        ]}
        selectedValue={GAS_RECOMMENDATIONS.HIGH}
      />
    </div>
  );
};
