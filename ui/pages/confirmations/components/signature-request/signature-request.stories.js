import React from 'react';
import { Provider } from 'react-redux';
import configureStore from '../../../../store/store';
import testData from '../../../../../.storybook/test-data';
import README from './README.mdx';
import SignatureRequest from './signature-request';

const store = configureStore({
  ...testData,
  metamask: {
    ...testData.metamask,
    selectedAddress: '0xb19ac54efa18cc3a14a5b821bfec73d284bf0c5e',
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
    msgParams: {
      ...DefaultStory.args.txData.msgParams,
      from: '0x64a845a5b02460acf8a3d84503b0d68d028b4bb4',
    },
  },
};
