import React from 'react';
import testData from '../../../../.storybook/test-data';
import README from './README.mdx';
import SignatureRequest from './signature-request.component';

const primaryIdentity = Object.values(testData.metamask.identities)[0];

export default {
  title: 'Components/App/SignatureRequest',
  id: __filename,
  component: SignatureRequest,
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
  return <SignatureRequest {...args} />;
};

DefaultStory.storyName = 'Default';

DefaultStory.args = {
  txData: {
    msgParams: {
      data: JSON.stringify({
        domain: {
          name: 'happydapp.website',
        },
        message: {
          string: 'haay wuurl',
          number: 42,
        },
      }),
      origin: 'https://happydapp.website/governance?futarchy=true',
    },
  },
  fromAccount: primaryIdentity,
};

DefaultStory.storyName = 'Default';
