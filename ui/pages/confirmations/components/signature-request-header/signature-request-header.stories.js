import React from 'react';
import SignatureRequestHeader from './signature-request-header';

export default {
  title: 'Confirmations/Components/SignatureRequestHeader',
  argTypes: {
    txData: { control: 'object' },
  },
  args: {
    txData: {
      msgParams: {
        from: '0xb19ac54efa18cc3a14a5b821bfec73d284bf0c5e',
        data: JSON.stringify({
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
        origin: 'https://happydapp.website/',
      },
    },
  },
};

export const DefaultStory = (args) => {
  return <SignatureRequestHeader {...args} />;
};

DefaultStory.storyName = 'Default';
