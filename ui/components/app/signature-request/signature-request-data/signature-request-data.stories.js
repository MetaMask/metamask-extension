import React from 'react';
import SignatureRequestData from './signature-request-data';
import { sanitizeMessage } from 'ui/helpers/utils/util';

export default {
  title: 'Components/App/SignatureRequest/SignatureRequestData',

  component: SignatureRequestData,
  argTypes: {
    data: { control: 'object' },
  },
};

export const DefaultStory = (args) => {
  return <SignatureRequestData {...args} />;
};

DefaultStory.storyName = 'Default';

const rawMessage = {
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
};

DefaultStory.args = {
  data: sanitizeMessage(
    rawMessage.message,
    rawMessage.primaryType,
    rawMessage.types,
  ),
};
