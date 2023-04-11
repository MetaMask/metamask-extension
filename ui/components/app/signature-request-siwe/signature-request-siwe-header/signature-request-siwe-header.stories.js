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
  isSIWEDomainValid: true,
  subjectMetadata,
};

export const ErrorStory = (args) => <SignatureRequestSIWEHeader {...args} />;

ErrorStory.storyName = 'Error';

ErrorStory.args = {
  fromAccount: primaryIdentity,
  domain: window.location.host,
  isSIWEDomainValid: false,
  subjectMetadata,
};
