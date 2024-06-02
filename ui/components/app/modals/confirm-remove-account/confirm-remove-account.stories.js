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
      address: '0x64a845a5b02460acf8a3d84503b0d68d028b4bb4',
      id: 'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3',
      metadata: {
        name: 'This is a Really Long Account Name',
        keyring: {
          type: 'HD Key Tree',
        },
      },
      options: {},
      methods: [
        EthMethod.PersonalSign,
        EthMethod.Sign,
        EthMethod.SignTransaction,
        EthMethod.SignTypedDataV1,
        EthMethod.SignTypedDataV3,
        EthMethod.SignTypedDataV4,
      ],
      type: EthAccountType.Eoa,
    },
  },
};

const Template = (args) => {
  return <ConfirmRemoveAccount {...args} />;
};

export const DefaultStory = Template.bind({});

DefaultStory.storyName = 'Default';
