import React from 'react';

import DetectedTokenAddress from './detected-token-address';

export default {
  title: 'Components/App/DetectedToken/DetectedTokenAddress',
  id: __filename,
  argTypes: {
    address: { control: 'text' },
  },
  args: {
    address: '0xc011a73ee8576fb46f5e1c5751ca3b9fe0af2a6f',
  },
};

const Template = (args) => {
  return <DetectedTokenAddress address={args.address} />;
};

export const DefaultStory = Template.bind({});

DefaultStory.storyName = 'Default';
