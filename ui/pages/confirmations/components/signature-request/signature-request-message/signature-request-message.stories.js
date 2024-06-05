import React from 'react';
import { sanitizeMessage } from '../../../../../helpers/utils/util';
import SignatureRequestMessage from './signature-request-message';

export default {
  title: 'Confirmations/Components/SignatureRequestMessage',
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

const rawMessage = {
  domain: {
    chainId: 97,
    name: 'Ether Mail',
    verifyingContract: '0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC',
    version: '1',
  },
  message: {
    contents: 'Hello, Bob!',
    from: {
      name: 'Cow',
      wallets: [
        '0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826',
        '0xDeaDbeefdEAdbeefdEadbEEFdeadbeEFdEaDbeeF',
        '0x06195827297c7A80a443b6894d3BDB8824b43896',
      ],
    },
    to: [
      {
        name: 'Bob',
        wallets: [
          '0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB',
          '0xB0BdaBea57B0BDABeA57b0bdABEA57b0BDabEa57',
          '0xB0B0b0b0b0b0B000000000000000000000000000',
        ],
      },
    ],
  },
  primaryType: 'Mail',
  types: {
    EIP712Domain: [
      { name: 'name', type: 'string' },
      { name: 'version', type: 'string' },
      { name: 'chainId', type: 'uint256' },
      { name: 'verifyingContract', type: 'address' },
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
};

DefaultStory.args = {
  data: sanitizeMessage(
    rawMessage.message,
    rawMessage.primaryType,
    rawMessage.types,
  ),
  messageIsScrollable: true,
};
