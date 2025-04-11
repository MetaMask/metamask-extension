import React from 'react';

import HexToDecimal from './hex-to-decimal.component';
import README from './README.mdx';

export default {
  title: 'Components/UI/HexToDecimal',

  component: HexToDecimal,
  parameters: {
    docs: {
      page: README,
    },
  },
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
