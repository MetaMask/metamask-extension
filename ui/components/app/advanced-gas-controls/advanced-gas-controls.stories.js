import React from 'react';
import AdvancedGasControls from '.';

export default {
  title: 'Components/App/AdvancedGasControls',
  component: AdvancedGasControls,
  argTypes: {
    onManualChange: {
      action: 'onManualChange',
    },
    gasLimit: {
      control: 'number',
    },
    setGasLimit: {
      action: 'setGasLimit',
    },
    gasPrice: {
      control: 'text',
    },
    setGasPrice: {
      action: 'setGasPrice',
    },
    minimumGasLimit: {
      control: 'text',
    },
    gasErrors: {
      control: 'object',
    },
  },
};

export const DefaultStory = (args) => {
  return (
    <div style={{ width: '600px' }}>
      <AdvancedGasControls {...args} />
    </div>
  );
};

DefaultStory.storyName = 'Default';
