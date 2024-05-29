import React from 'react';
import testData from '../../../../../../.storybook/test-data';
import SignatureRequestSIWEHeader from '.';

const primaryAccount = Object.values(
  testData.metamask.internalAccounts.accounts,
)[0];
const subjectMetadata = {
  iconUrl: '/images/logo/metamask-fox.svg',
  name: 'MetaMask',
  origin: 'http://localhost:8080',
};

export default {
  title:
    'Confirmations/Components/SignatureRequestSIWE/SignatureRequestSIWEHeader',

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
  fromAccount: primaryAccount,
  domain: window.location.host,
  isSIWEDomainValid: true,
  subjectMetadata,
};

export const ErrorStory = (args) => <SignatureRequestSIWEHeader {...args} />;

ErrorStory.storyName = 'Error';

ErrorStory.args = {
  fromAccount: primaryAccount,
  domain: window.location.host,
  isSIWEDomainValid: false,
  subjectMetadata,
};
