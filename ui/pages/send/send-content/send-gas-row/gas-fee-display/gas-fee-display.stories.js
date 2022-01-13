import React from 'react';
import GasFeeDisplay from './gas-fee-display.component';

export default {
  title: 'Pages/Send/SendContent/SendGasRow/GasFeeDisplay',
  id: __filename,
  argTypes: {
    gasTotal: { control: 'number' },
    gasLoadingError: { control: 'boolean' },
    onReset: { action: 'OnReset' },
  },
};

export const DefaultStory = (args) => {
  return <GasFeeDisplay {...args} />;
};

DefaultStory.storyName = 'Default';
DefaultStory.args = {
  gasTotal: 10000000000,
  gasLoadingError: false,
};
