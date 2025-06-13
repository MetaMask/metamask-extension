import React from 'react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import configureStore from '../../../../store/store';
import testData from '../../../../../.storybook/test-data';
import RemoteSignerInformation from './remote-signer-information.component';

const store = configureStore(testData);

const signerAddress = '0x0000000000000000000000000000000000000000';
const originalSenderAddress = '0x0000000000000000000000000000000000000001';

export default {
  title: 'Components/Vault/RemoteMode/RemoteSignerInformation',
  component: RemoteSignerInformation,
  decorators: [
    (story) => (
      <Provider store={store}>
        <MemoryRouter>{story()}</MemoryRouter>
      </Provider>
    ),
  ],
};

export const Default = () => (
  <RemoteSignerInformation
    signerAddress={signerAddress}
    originalSenderAddress={originalSenderAddress}
  />
);
