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
    txData: 'object',
  },
};

const txData = {
  txParams: {
    data: '0xa9059cbb000000000000000000000000b19ac54efa18cc3a14a5b821bfec73d284bf0c5e0000000000000000000000000000000000000000000000003782dace9d900000',
  },
  origin: 'https://metamask.github.io',
  type: 'transfer',
};

const dataComponent = <div>Any custom component passed in props</div>;

export const DefaultStory = (args) => {
  return <ConfirmData txData={args.txData} />;
};

DefaultStory.storyName = 'Default';
DefaultStory.args = {
  txData,
};

export const DataComponentStory = (args) => {
  return (
    <ConfirmData txData={args.txData} dataComponent={args.dataComponent} />
  );
};

DataComponentStory.storyName = 'DataComponent';
DataComponentStory.args = {
  txData,
  dataComponent,
};
