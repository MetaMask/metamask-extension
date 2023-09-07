import React from 'react';
import { EthAccountType, EthMethod } from '@metamask/keyring-api';
import ConfirmRemoveAccount from '.';

export default {
  title: 'Components/App/Modals/ConfirmRemoveAccount',

  component: ConfirmRemoveAccount,
  argTypes: {
    account: {
      control: 'object',
    },
  },
  args: {
    account: {
      address: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
      id: 'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3',
      metadata: {
        name: 'Test Account',
        keyring: {
          type: 'HD Key Tree',
        },
      },
      options: {},
      methods: [...Object.values(EthMethod)],
      type: EthAccountType.Eoa,
    },
  },
};

const Template = (args) => {
  return <ConfirmRemoveAccount {...args} />;
};

export const DefaultStory = Template.bind({});

DefaultStory.storyName = 'Default';
