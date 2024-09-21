import React from 'react';
import SignatureRequestMessage from '.';

export default {
  title:
    'Confirmations/Components/SignatureRequestSIWE/SignatureRequestMessage',

  argTypes: {
    data: {
      controls: 'object',
    },
  },
  args: {
    data: [
      { label: 'Label:', value: 'value' },
      {
        label: 'Message:',
        value:
          'Click to sign in and accept the Terms of Service: https://community.metamask.io/tos',
      },
      {
        label: 'URI:',
        value: 'http://localhost:8080',
      },
      {
        label: 'Version:',
        value: '1',
      },
      {
        label: 'Chain ID:',
        value: 1,
      },
      {
        label: 'Nonce:',
        value: 'STMt6KQMwwdOXE306',
      },
      {
        label: 'Issued At:',
        value: '2022-03-18T21:40:40.823Z',
      },
      {
        label: 'Resources: 2',
        value:
          'ipfs://Qme7ss3ARVgxv6rXqVPiikMJ8u2NLgmgszg13pYrDKEoiu\nhttps://example.com/my-web2-claim.json',
      },
    ],
  },
};

export const DefaultStory = (args) => <SignatureRequestMessage {...args} />;

DefaultStory.storyName = 'Default';
