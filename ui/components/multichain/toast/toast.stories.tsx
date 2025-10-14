import React from 'react';
import testData from '../../../../.storybook/test-data';
import {
  AvatarAccount,
  AvatarAccountSize,
} from '@metamask/design-system-react';
import { Toast } from '.';

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
  title: 'Components/Multichain/Toast',
  argTypes: {
    startAdornment: {
      control: 'text',
    },
    text: {
      control: 'text',
    },
    description: {
      control: 'text',
    },
    actionText: {
      control: 'text',
    },
    onActionClick: {
      action: 'onClick',
    },
    onClose: {
      action: 'onClick',
    },
  },
  args: {
    startAdornment: (
      <AvatarAccount
        address={CHAOS_ACCOUNT.address}
        size={AvatarAccountSize.Md}
      />
    ),
    text: 'This is the Toast text',
    description: 'This is the Toast description',
    actionText: 'Take some action',
    onActionClick: () => undefined,
    onClose: () => undefined,
  },
};

export const DefaultStory = (args) => <Toast {...args} />;

DefaultStory.storyName = 'Default';
