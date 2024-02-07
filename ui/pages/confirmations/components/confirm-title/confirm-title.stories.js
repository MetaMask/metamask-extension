import React from 'react';
import README from './README.mdx';
import ConfirmTitle from './confirm-title';

export default {
  title: 'Components/App/ConfirmTitle',

  component: ConfirmTitle,
  parameters: {
    docs: {
      page: README,
    },
  },
  argTypes: {
    txData: 'object',
    hexTransactionAmount: 'string',
    title: 'string',
  },
  args: {
    txData: {
      txParams: {},
      type: 'transfer',
    },
    hexTransactionAmount: '0x9184e72a000',
    title: undefined,
  },
};

export const DefaultStory = (args) => {
  return <ConfirmTitle {...args} />;
};

DefaultStory.storyName = 'Default';

export const ContractInteractionStory = (args) => {
  return <ConfirmTitle {...args} />;
};

ContractInteractionStory.storyName = 'ContractInteraction';
ContractInteractionStory.args = {
  txData: {
    txParams: {},
    type: 'contractInteraction',
  },
};

export const CustomTitleStory = (args) => {
  return <ConfirmTitle {...args} />;
};

CustomTitleStory.storyName = 'CustomTitle';
CustomTitleStory.args = {
  title: 'Any custom title passed',
};
