import React from 'react';
import { GAS_RECOMMENDATIONS } from '../../../../shared/constants/gas';
import README from './README.mdx';
import RadioGroup from '.';

export default {
  title: 'Components/UI/RadioGroup',

  component: RadioGroup,
  parameters: {
    docs: {
      page: README,
    },
  },
  argTypes: {
    options: { control: 'array' },
    selectedValue: { control: 'text' },
    name: { control: 'text' },
    onChange: { action: 'onChange' },
  },
};

export const DefaultStory = (args) => {
  return (
    <div className="radio-group" style={{ minWidth: '600px' }}>
      <RadioGroup {...args} />
    </div>
  );
};
DefaultStory.storyName = 'Default';
DefaultStory.args = {
  name: 'gas-recommendation',
  options: [
    { value: GAS_RECOMMENDATIONS.LOW, label: 'Low', recommended: false },
    {
      value: GAS_RECOMMENDATIONS.MEDIUM,
      label: 'Medium',
      recommended: false,
    },
    { value: GAS_RECOMMENDATIONS.HIGH, label: 'High', recommended: true },
  ],
  selectedValue: GAS_RECOMMENDATIONS.HIGH,
};
