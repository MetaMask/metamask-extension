import React from 'react';
import testData from '../../../../.storybook/test-data';
import README from './README.mdx';
import SignatureRequest from './signature-request.component';

const [MOCK_PRIMARY_IDENTITY] = Object.values(testData.metamask.identities);

export default {
  title: 'Components/App/SignatureRequest',

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
    hardwareWalletRequiresConnection: { control: 'boolean' },
    isLedgerWallet: { control: 'boolean' },
    clearConfirmTransaction: { action: 'Clean Confirm' },
    cancel: { action: 'Cancel' },
    sign: { action: 'Sign' },
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
      origin: 'https://happydapp.website/',
    },
  },
  fromAccount: MOCK_PRIMARY_IDENTITY,
  provider: { name: 'Goerli ETH' },
};
