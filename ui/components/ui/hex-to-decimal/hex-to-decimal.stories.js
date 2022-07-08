import React from 'react';
import HexToDecimal from './hex-to-decimal.component';

export default {
  title: 'Components/UI/HexToDecimal',
  id: __filename,
  component: HexToDecimal,
  argsTypes: {
    text: {
      control: 'text',
    },
    className: {
      value: 'text',
    },
  },
};

export const DefaultHexToDecimal = (args) => {
  return <HexToDecimal {...args} />;
};

DefaultHexToDecimal.storyName = 'Default';

DefaultHexToDecimal.args = {
  value: '0x3039',
};
