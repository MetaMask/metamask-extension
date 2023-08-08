import React from 'react';
import { Provider } from 'react-redux';
import { action } from '@storybook/addon-actions';
import configureStore from '../../../../store/store';
import testData from '../../../../../.storybook/test-data';

import SendAssetRow from './send-asset-row.component';

// Using Test Data For Redux
const store = configureStore(testData);

export default {
  title: 'Pages/Send/SendContent/SendAssetRow',

  decorators: [(story) => <Provider store={store}>{story()}</Provider>],
};

export const DefaultStory = () => {
  const { metamask } = store.getState();

  const { internalAccounts, assetImages, tokens } = metamask;
  const accounts = Object.values(internalAccounts.accounts);
  const selectedAccount =
    internalAccounts.accounts[internalAccounts.selectedAccount];

  return (
    <SendAssetRow
      tokens={tokens}
      selectedAccount={selectedAccount}
      accounts={accounts}
      assetImages={assetImages}
      setSendToken={() => undefined}
      setUnsendableAssetError={() => undefined}
      updateSendErrors={() => undefined}
      updateSendAsset={() => undefined}
      updateTokenType={(type) => action(`Selected Token: ${type}`)()}
      sendAsset={{}}
    />
  );
};

DefaultStory.storyName = 'Default';
