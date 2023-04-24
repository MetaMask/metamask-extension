import React from 'react';
import ExportPrivateKeyModal from './export-private-key-modal.component';
import { Provider } from 'react-redux';
import testData from '../../../../../.storybook/test-data';
import configureStore from '../../../../store/store';

// Using Test Data For Redux
const store = configureStore(testData);

export default {
  title: 'Components/App/Modals/ExportPrivateKeyModal',
  decorators: [(story) => <Provider store={store}>{story()}</Provider>],
  argsTypes: {
    exportAccount: { action: 'exportAccount' },
  },
};

export const DefaultStory = () => {
  return (
    <ExportPrivateKeyModal
      // mock actions
      exportAccount={() => {
        return 'mockPrivateKey';
      }}
      selectedIdentity={
        testData.metamask.identities[testData.metamask.selectedAddress]
      }
      hideModal={() => {}}
      hideWarning={() => {}}
      clearAccountDetails={() => {}}
    />
  );
};

DefaultStory.storyName = 'Default';
