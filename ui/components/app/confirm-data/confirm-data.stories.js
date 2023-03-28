import React from 'react';
import README from './README.mdx';
import ConfirmData from './confirm-data';

export default {
  title: 'Components/App/ConfirmData',

  component: ConfirmData,
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
      },
      origin: 'https://metamask.github.io',
      type: 'transfer',
    },
  },
};

export const DefaultStory = (args) => {
  return <ConfirmData {...args} />;
};

DefaultStory.storyName = 'Default';

export const DataComponentStory = (args) => {
  return <ConfirmData {...args} />;
};

DataComponentStory.storyName = 'DataComponent';
DataComponentStory.args = {
  dataComponent: <div>Any custom component passed in props</div>,
};
