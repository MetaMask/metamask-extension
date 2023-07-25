import React from 'react';
import SignatureRequestOriginalWarning from './signature-request-original-warning';

export default {
  title: 'Components/App/SignatureRequestOriginalWarning',
  component: SignatureRequestOriginalWarning,
  argTypes: {
    senderAddress: {
      control: 'text',
    },
    name: {
      control: 'text',
    },
    onSubmit: {
      action: 'onSubmit',
    },
    onCancel: {
      action: 'onCancel',
    },
  },
  args: {
    senderAddress: '0x5CfE73b6021E818B776b421B1c4Db2474086a7e1',
    name: 'John Doe',
  },
};

export const DefaultStory = (args) => (
  <SignatureRequestOriginalWarning {...args} />
);

DefaultStory.storyName = 'Default';
