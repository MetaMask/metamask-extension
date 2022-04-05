import React from 'react';
import testData from '../../../../.storybook/test-data';
import README from './README.mdx';
import SignatureRequestSIWE from './signature-request-siwe.component';
import msgParams from './example.msgParams.json';
import badMsgParams from './example2.msgParams.json';

const primaryIdentity = Object.values(testData.metamask.identities)[0];

export default {
  title: 'Components/App/SignInWithEthereum/SignatureRequestSIWE',
  id: __filename,
  component: SignatureRequestSIWE,
  parameters: {
    docs: {
      page: README,
    },
  },
  argTypes: {
    txData: { control: 'object' },
    fromAccount: {
      table: {
        address: { control: 'text' },
        balance: { control: 'text' },
        name: { control: 'text' },
      },
    },
    isLedgerWallet: { control: 'boolean' },
    clearConfirmTransaction: { action: 'Clean Confirm' },
    cancel: { action: 'Cancel' },
    sign: { action: 'Sign' },
    hardwareWalletRequiresConnection: {
      action: 'hardwareWalletRequiresConnection',
    },
  },
};

export const DefaultStory = (args) => {
  return <SignatureRequestSIWE {...args} />;
};

DefaultStory.storyName = 'Default';

DefaultStory.args = {
  txData: {
    msgParams,
  },
  fromAccount: primaryIdentity,
};

DefaultStory.storyName = 'Default';

export const BadDomainStory = (args) => {
  return <SignatureRequestSIWE {...args} />;
};

BadDomainStory.storyName = 'BadDomain';

BadDomainStory.args = {
  txData: {
    msgParams: badMsgParams,
  },
  fromAccount: primaryIdentity,
};

BadDomainStory.storyName = 'BadDomain';
