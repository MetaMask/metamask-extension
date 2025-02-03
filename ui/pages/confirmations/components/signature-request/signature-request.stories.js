import React from 'react';
import { Provider } from 'react-redux';
import { CHAIN_IDS } from '@metamask/transaction-controller';
import configureStore from '../../../../store/store';
import testData from '../../../../../.storybook/test-data';
import { mockNetworkState } from '../../../../../test/stub/networks';
import README from './README.mdx';
import SignatureRequest from './signature-request';

const CHAIN_ID_MOCK = CHAIN_IDS.MAINNET;

const store = configureStore({
  ...testData,
  metamask: {
    ...testData.metamask,
    ...mockNetworkState({ chainId: CHAIN_ID_MOCK }),
  },
});

export default {
  title: 'Confirmations/Components/SignatureRequest',
  decorators: [(story) => <Provider store={store}>{story()}</Provider>],
  component: SignatureRequest,
  parameters: {
    docs: {
      page: README,
    },
  },
  argTypes: {
    txData: { control: 'object' },
  },
};

export const DefaultStory = (args) => {
  return <SignatureRequest {...args} />;
};

DefaultStory.storyName = 'Default';

DefaultStory.args = {
  txData: {
    chainId: CHAIN_ID_MOCK,
    msgParams: {
      from: '0xb19ac54efa18cc3a14a5b821bfec73d284bf0c5e',
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
};

export const AccountMismatchStory = (args) => {
  return <SignatureRequest {...args} />;
};

AccountMismatchStory.storyName = 'AccountMismatch';

AccountMismatchStory.args = {
  ...DefaultStory.args,
  txData: {
    chainId: CHAIN_ID_MOCK,
    msgParams: {
      ...DefaultStory.args.txData.msgParams,
      from: '0x64a845a5b02460acf8a3d84503b0d68d028b4bb4',
    },
  },
};
