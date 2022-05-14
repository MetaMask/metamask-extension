import React from 'react';
import { MESSAGE_TYPE } from '../../../../shared/constants/app';
import testData from '../../../../.storybook/test-data';
import README from './README.mdx';
import SignatureRequestOriginal from './signature-request-original.component';

const MOCK_PRIMARY_IDENTITY = Object.values(testData.metamask.identities)[0];

const MOCK_TX_MSG_PARAMS = {
  data: JSON.stringify({
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
  }),
  origin: 'https://happydapp.website/governance?futarchy=true',
};

export default {
  title: 'Components/App/SignatureRequestOriginal',
  id: __filename,
  component: SignatureRequestOriginal,
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
    hardwareWalletRequiresConnection: { control: 'boolean' },
    isLedgerWallet: { control: 'boolean' },
    clearConfirmTransaction: { action: 'Clean Confirm' },
    cancel: { action: 'Cancel' },
    sign: { action: 'Sign' },
  },
};

export const DefaultStory = (args) => {
  return <SignatureRequestOriginal {...args} />;
};

DefaultStory.storyName = 'personal_sign Type';

DefaultStory.args = {
  txData: {
    msgParams: { ...MOCK_TX_MSG_PARAMS },
    type: MESSAGE_TYPE.PERSONAL_SIGN,
  },
  fromAccount: MOCK_PRIMARY_IDENTITY,
};

export const ETHSignStory = (args) => {
  return <SignatureRequestOriginal {...args} />;
};

ETHSignStory.storyName = 'eth_sign Type';

ETHSignStory.args = {
  txData: {
    msgParams: { ...MOCK_TX_MSG_PARAMS },
    type: MESSAGE_TYPE.ETH_SIGN,
  },
  fromAccount: MOCK_PRIMARY_IDENTITY,
};
