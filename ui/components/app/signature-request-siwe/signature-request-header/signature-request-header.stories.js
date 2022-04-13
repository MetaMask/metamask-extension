import React from 'react';
import testData from '../../../../../.storybook/test-data';
import SignatureRequestHeader from '.';

const primaryIdentity = Object.values(testData.metamask.identities)[0];
const subjectMetadata = {
  iconUrl: '/images/logo/metamask-fox.svg',
  name: 'Metamask',
  origin: 'http://localhost:8080',
};

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
    subjectMetadata: { control: 'object' },
  },
};

export const DefaultStory = (args) => <SignatureRequestHeader {...args} />;

DefaultStory.storyName = 'Default';

DefaultStory.args = {
  fromAccount: primaryIdentity,
  domain: window.location.host,
  subjectMetadata,
};
