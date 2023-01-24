import React from 'react';

import DetectedTokenAddress from './detected-token-address';

export default {
  title: 'Components/App/DetectedToken/DetectedTokenAddress',

  argTypes: {
    tokenAddress: { control: 'text' },
  },
  args: {
    tokenAddress: '0xc011a73ee8576fb46f5e1c5751ca3b9fe0af2a6f',
  },
};

const Template = (args) => {
  return <DetectedTokenAddress {...args} />;
};

export const DefaultStory = Template.bind({});

DefaultStory.storyName = 'Default';
