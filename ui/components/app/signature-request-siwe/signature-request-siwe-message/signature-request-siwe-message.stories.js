import React from 'react';
import SignatureRequestMessage from '.';

export default {
  title: 'Components/App/SignatureRequestSIWE/SignatureRequestMessage',
  id: __filename,
  argTypes: {
    data: {
      controls: 'object',
    },
  },
  args: {
    data: [
      { label: 'Label', value: 'value' },
      {
        label: 'Message:',
        value:
          'Click to sign in and accept the Terms of Service: https://community.metamask.io/tos',
      },
      {
        label: 'URI:',
        value: 'http://localhost:8080',
      },
    ],
  },
};

export const DefaultStory = (args) => <SignatureRequestMessage {...args} />;

DefaultStory.storyName = 'Default';
