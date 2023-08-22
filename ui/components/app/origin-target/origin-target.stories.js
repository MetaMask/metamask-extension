import React from 'react';
import OriginTarget from '.';

export default {
  title: 'Components/App/OriginTarget',

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
  return <OriginTarget {...args} />;
};

DefaultStory.storyName = 'Default';
