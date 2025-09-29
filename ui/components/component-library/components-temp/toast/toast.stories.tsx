import React from 'react';
import { Toast } from '.';
import testData from '../../../../../.storybook/test-data';
import {
  AvatarAccount,
  AvatarAccountSize,
} from '@metamask/design-system-react';

const [chaosAccount] = Object.values(
  testData.metamask.internalAccounts.accounts,
);

const CHAOS_ACCOUNT = {
  ...chaosAccount,
  balance: '0x152387ad22c3f0',
  keyring: {
    type: 'HD Key Tree',
  },
};

export default {
  title: 'Components/ComponentLibrary/Temp/Toast',
  argTypes: {
    startAccessory: {
      control: 'text',
    },
    title: {
      control: 'text',
    },
    description: {
      control: 'text',
    },
    actionButtonLabel: {
      control: 'text',
    },
    actionButtonOnClick: {
      action: 'onClick',
    },
    onClose: {
      action: 'onClick',
    },
  },
  args: {
    startAccessory: (
      <AvatarAccount
        address={CHAOS_ACCOUNT.address}
        size={AvatarAccountSize.Md}
      />
    ),
    title: 'This is the Toast title',
    description: 'This is the Toast description',
    actionButtonLabel: 'Take some action',
    actionButtonOnClick: () => undefined,
    onClose: () => undefined,
  },
};

export const DefaultStory = (args) => <Toast {...args} />;

DefaultStory.storyName = 'Default';
