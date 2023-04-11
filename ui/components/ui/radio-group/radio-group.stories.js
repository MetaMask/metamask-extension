import React from 'react';
import { GasRecommendations } from '../../../../shared/constants/gas';
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
    { value: GasRecommendations.low, label: 'Low', recommended: false },
    {
      value: GasRecommendations.medium,
      label: 'Medium',
      recommended: false,
    },
    { value: GasRecommendations.high, label: 'High', recommended: true },
  ],
  selectedValue: GasRecommendations.high,
};
