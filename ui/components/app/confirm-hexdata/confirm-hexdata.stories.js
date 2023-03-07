import React from 'react';
import README from './README.mdx';
import ConfirmHexData from './confirm-hexdata';

export default {
  title: 'Components/App/ConfirmHexData',

  component: ConfirmHexData,
  parameters: {
    docs: {
      page: README,
    },
  },
  argTypes: {
    txData: {
      control: 'object',
    },
    dataHexComponent: {
      control: 'element',
    },
  },
  args: {
    txData: {
      txParams: {
        data: '0xa9059cbb000000000000000000000000b19ac54efa18cc3a14a5b821bfec73d284bf0c5e0000000000000000000000000000000000000000000000003782dace9d900000',
        to: '0x0',
      },
      origin: 'https://metamask.github.io',
      type: 'transfer',
    },
  },
};

export const DefaultStory = (args) => {
  return <ConfirmHexData {...args} />;
};

DefaultStory.storyName = 'Default';

export const DataHexComponentStory = (args) => {
  return <ConfirmHexData {...args} />;
};

DataHexComponentStory.storyName = 'DataHexComponent';
DataHexComponentStory.args = {
  dataHexComponent: <div>Any custom component passed in props</div>,
};
