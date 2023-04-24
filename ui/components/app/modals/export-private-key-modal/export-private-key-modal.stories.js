import React from 'react';
import { Provider } from 'react-redux';
import testData from '../../../../../.storybook/test-data';
import configureStore from '../../../../store/store';
import ExportPrivateKeyModal from './export-private-key-modal.component';

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
    />
  );
};

DefaultStory.storyName = 'Default';
