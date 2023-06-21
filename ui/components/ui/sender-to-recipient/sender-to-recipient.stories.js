import React from 'react';
import {
  DEFAULT_VARIANT,
  CARDS_VARIANT,
  FLAT_VARIANT,
} from './sender-to-recipient.constants';
import SenderToRecipient from '.';

export default {
  title: 'Components/UI/SenderToRecipient',

  argTypes: {
    senderName: {
      control: 'text',
    },
    senderAddress: {
      control: 'text',
    },
    recipientName: {
      control: 'text',
    },
    recipientEns: {
      control: 'text',
    },
    recipientAddress: {
      control: 'text',
    },
    recipientNickname: {
      control: 'text',
    },
    variant: {
      control: 'select',
      options: [DEFAULT_VARIANT, CARDS_VARIANT, FLAT_VARIANT],
    },
    addressOnly: {
      control: 'boolean',
    },
    onRecipientClick: {
      action: 'onRecipientClick',
    },
    onSenderClick: {
      action: 'onSenderClick',
    },
    warnUserOnAccountMismatch: {
      control: 'boolean',
    },
  },
  args: {
    senderName: 'Account 1',
    senderAddress: '0x64a845a5b02460acf8a3d84503b0d68d028b4bb4',
    recipientName: 'Account 2',
    recipientAddress: '0xb19ac54efa18cc3a14a5b821bfec73d284bf0c5e',
  },
};

export const DefaultStory = (args) => {
  return <SenderToRecipient {...args} />;
};

DefaultStory.storyName = 'Default';
