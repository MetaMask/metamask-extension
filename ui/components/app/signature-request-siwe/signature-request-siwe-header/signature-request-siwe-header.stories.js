import React from 'react';
import testData from '../../../../../.storybook/test-data';
import SignatureRequestSIWEHeader from '.';

const primaryIdentity = Object.values(testData.metamask.identities)[0];
const subjectMetadata = {
  iconUrl: '/images/logo/metamask-fox.svg',
  name: 'MetaMask',
  origin: 'http://localhost:8080',
};

export default {
  title: 'Components/App/SignatureRequestSIWE/SignatureRequestSIWEHeader',
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

export const DefaultStory = (args) => <SignatureRequestSIWEHeader {...args} />;

DefaultStory.storyName = 'Default';

DefaultStory.args = {
  fromAccount: primaryIdentity,
  domain: window.location.host,
  subjectMetadata,
};
