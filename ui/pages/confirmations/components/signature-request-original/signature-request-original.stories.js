import React from 'react';
import { action } from '@storybook/addon-actions';
import { CHAIN_IDS } from '@metamask/transaction-controller';
import { Provider } from 'react-redux';
import { MESSAGE_TYPE } from '../../../../../shared/constants/app';
import testData from '../../../../../.storybook/test-data';
import configureStore from '../../../../store/store';
import { mockNetworkState } from '../../../../../test/stub/networks';
import README from './README.mdx';
import SignatureRequestOriginal from './signature-request-original.component';

const CHAIN_ID_MOCK = CHAIN_IDS.MAINNET;

const [MOCK_PRIMARY_ACCOUNT, MOCK_SECONDARY_ACCOUNT] = Object.values(
  testData.metamask.internalAccounts.accounts,
);

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

const store = configureStore({
  ...testData,
  metamask: {
    ...testData.metamask,
    ...mockNetworkState({ chainId: CHAIN_ID_MOCK }),
  },
});

export default {
  title: 'Confirmations/Components/SignatureRequestOriginal',
  decorators: [(story) => <Provider store={store}>{story()}</Provider>],
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
    fromAccount: MOCK_PRIMARY_ACCOUNT,
    history: {
      push: action('history.push()'),
    },
    mostRecentOverviewPage: '/',
    nativeCurrency: 'ETH',
    selectedAccount: MOCK_PRIMARY_ACCOUNT,
  },
};

const Template = (args) => {
  return <SignatureRequestOriginal {...args} />;
};

export const DefaultStory = Template.bind({});

DefaultStory.storyName = 'personal_sign Type';

DefaultStory.args = {
  txData: {
    chainId: CHAIN_ID_MOCK,
    msgParams: {
      from: '0xb19ac54efa18cc3a14a5b821bfec73d284bf0c5e',
      data: MOCK_SIGN_DATA,
      origin: 'https://happydapp.website/governance?futarchy=true',
    },
    type: MESSAGE_TYPE.PERSONAL_SIGN,
  },
};

export const ETHSignTypedStory = Template.bind({});

ETHSignTypedStory.storyName = 'eth_signTypedData Type';

ETHSignTypedStory.args = {
  txData: {
    chainId: CHAIN_ID_MOCK,
    msgParams: {
      from: '0xb19ac54efa18cc3a14a5b821bfec73d284bf0c5e',
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

export const AccountMismatchStory = Template.bind({});

AccountMismatchStory.storyName = 'Account Mismatch warning';

AccountMismatchStory.args = {
  txData: {
    chainId: CHAIN_ID_MOCK,
    msgParams: {
      from: '0x64a845a5b02460acf8a3d84503b0d68d028b4bb4',
      data: MOCK_SIGN_DATA,
      origin: 'https://happydapp.website/governance?futarchy=true',
    },
    type: MESSAGE_TYPE.PERSONAL_SIGN,
  },
  selectedAccount: MOCK_SECONDARY_ACCOUNT,
};
