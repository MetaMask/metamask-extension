import React from 'react';
import { action } from '@storybook/addon-actions';
import { MESSAGE_TYPE } from '../../../../shared/constants/app';
import testData from '../../../../.storybook/test-data';
import README from './README.mdx';
import SignatureRequestOriginal from './signature-request-original.component';

const [MOCK_PRIMARY_IDENTITY] = Object.values(testData.metamask.identities);

const MOCK_SIGN_DATA = JSON.stringify({
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
});

export default {
  title: 'Components/App/SignatureRequestOriginal',

  component: SignatureRequestOriginal,
  parameters: {
    docs: {
      page: README,
    },
  },
  argTypes: {
    fromAccount: {
      table: {
        address: { control: 'text' },
        balance: { control: 'text' },
        name: { control: 'text' },
      },
    },
    hardwareWalletRequiresConnection: { control: 'boolean' },
    isLedgerWallet: { control: 'boolean' },
    nativeCurrency: { control: 'text' },
    txData: { control: 'object' },
    clearConfirmTransaction: { action: 'Clean Confirm' },
    cancel: { action: 'Cancel' },
    sign: { action: 'Sign' },
  },
  args: {
    fromAccount: MOCK_PRIMARY_IDENTITY,
    history: {
      push: action('history.push()'),
    },
    mostRecentOverviewPage: '/',
    nativeCurrency: 'ETH',
    provider: { name: 'Goerli ETH' },
  },
};

const Template = (args) => {
  return <SignatureRequestOriginal {...args} />;
};

export const DefaultStory = Template.bind({});

DefaultStory.storyName = 'personal_sign Type';

DefaultStory.args = {
  txData: {
    msgParams: {
      data: MOCK_SIGN_DATA,
      origin: 'https://happydapp.website/governance?futarchy=true',
    },
    type: MESSAGE_TYPE.PERSONAL_SIGN,
  },
};

export const ETHSignStory = Template.bind({});

ETHSignStory.storyName = 'eth_sign Type';

ETHSignStory.args = {
  txData: {
    msgParams: {
      data: MOCK_SIGN_DATA,
      origin: 'https://happydapp.website/governance?futarchy=true',
    },
    type: MESSAGE_TYPE.ETH_SIGN,
  },
};

export const ETHSignTypedStory = Template.bind({});

ETHSignTypedStory.storyName = 'eth_signTypedData Type';

ETHSignTypedStory.args = {
  txData: {
    msgParams: {
      data: [
        {
          type: 'string',
          name: 'Message',
          value: 'Hi, Alice!',
        },
        {
          type: 'uint32',
          name: 'A number',
          value: '1337',
        },
      ],
      origin: 'https://happydapp.website/governance?futarchy=true',
    },
    type: MESSAGE_TYPE.ETH_SIGN_TYPED_DATA,
  },
};
