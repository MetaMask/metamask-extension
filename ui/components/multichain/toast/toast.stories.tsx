import React from 'react';
import testData from '../../../../.storybook/test-data';
import { AvatarAccount, AvatarAccountSize } from '../../component-library';
import { BorderColor } from '../../../helpers/constants/design-system';
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
        borderColor={BorderColor.transparent}
      />
    ),
    text: 'This is the Toast text',
    actionText: 'Take some action',
    onActionClick: () => undefined,
    onClose: () => undefined,
  },
};

export const DefaultStory = (args) => <Toast {...args} />;

DefaultStory.storyName = 'Default';
