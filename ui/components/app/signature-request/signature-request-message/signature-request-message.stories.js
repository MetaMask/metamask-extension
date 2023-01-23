import React from 'react';
import SignatureRequestMessage from './signature-request-message';

export default {
  title: 'Components/App/SignatureRequestMessage',

  component: SignatureRequestMessage,
  argTypes: {
    data: { control: 'object' },
    onMessageScrolled: { action: 'onMessageScrolled' },
    setMessageRootRef: { action: 'setMessageRootRef' },
    messageRootRef: { control: 'object' },
    messageIsScrollable: { control: 'boolean' },
  },
};

export const DefaultStory = (args) => {
  return <SignatureRequestMessage {...args} />;
};

DefaultStory.storyName = 'Default';

DefaultStory.args = {
  data: JSON.parse(
    JSON.stringify({
      domain: {
        name: 'happydapp.website',
      },
      message: {
        string: 'haay wuurl',
        number: 42,
      },
      primaryType: 'Mail',
      types: {
        EIP712Domain: [
          { name: 'name', type: 'string' },
          { name: 'version', type: 'string' },
          { name: 'chainId', type: 'uint256' },
          { name: 'verifyingContract', type: 'address' },
        ],
        Group: [
          { name: 'name', type: 'string' },
          { name: 'members', type: 'Person[]' },
        ],
        Mail: [
          { name: 'from', type: 'Person' },
          { name: 'to', type: 'Person[]' },
          { name: 'contents', type: 'string' },
        ],
        Person: [
          { name: 'name', type: 'string' },
          { name: 'wallets', type: 'address[]' },
        ],
      },
    }),
  ),
  messageIsScrollable: true,
};
