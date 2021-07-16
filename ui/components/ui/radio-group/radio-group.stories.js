import React from 'react';
import RadioGroup from '.';

export default {
  title: 'RadioGroup',
};

export const radioGroup = () => {
  return (
    <div className="radio-group" style={{ minWidth: '600px' }}>
      <RadioGroup
        name="gas-recommendation"
        options={[
          { value: 'low', label: 'Low', recommended: false },
          { value: 'medium', label: 'Medium', recommended: false },
          { value: 'high', label: 'High', recommended: true },
        ]}
        selectedValue="high"
      />
    </div>
  );
};
