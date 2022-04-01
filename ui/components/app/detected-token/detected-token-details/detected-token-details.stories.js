import React from 'react';

import DetectedTokenDetails from './detected-token-details';

export default {
  title: 'Components/App/DetectedToken/DetectedTokenDetails',
  id: __filename,
  argTypes: {
    address: { control: 'text' },
  },
  args: {
    address: '0xc011a73ee8576fb46f5e1c5751ca3b9fe0af2a6f',
  },
};

const Template = (args) => {
  return (
    <div style={{ width: '320px' }}>
      <DetectedTokenDetails tokenAddress={args.address} />
    </div>
  );
};

export const DefaultStory = Template.bind({});

DefaultStory.storyName = 'Default';
