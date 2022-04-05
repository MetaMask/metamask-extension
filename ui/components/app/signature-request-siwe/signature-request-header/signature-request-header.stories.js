import React from 'react';
import testData from '../../../../../.storybook/test-data';
import SignatureRequestHeader from '.';

const primaryIdentity = Object.values(testData.metamask.identities)[0];

export default {
  title: 'Components/App/SignInWithEthereum/SignatureRequestSIWEHeader',
  id: __filename,
  argTypes: {
    fromAccount: {
      table: {
        address: { control: 'text' },
        balance: { control: 'text' },
        name: { control: 'text' },
      },
    },
    domain: { control: 'text' },
  },
};

export const DefaultStory = (args) => <SignatureRequestHeader {...args} />;

DefaultStory.storyName = 'Default';

DefaultStory.args = {
  fromAccount: primaryIdentity,
  domain: window.location.host,
};
