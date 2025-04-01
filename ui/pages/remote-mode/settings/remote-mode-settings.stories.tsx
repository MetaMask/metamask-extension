import React from 'react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import configureStore from '../../../store/store';
import RemoteModeSettings from './remote-mode-settings.component';
import testData from '../../../../.storybook/test-data';

const store = configureStore(testData);

export default {
  title: 'Pages/Vault/RemoteMode/Settings',
  component: RemoteModeSettings,
  id: 'pages-remote-mode-settings--docs',
  decorators: [
    (story) => (
      <Provider store={store}>
        <MemoryRouter>{story()}</MemoryRouter>
      </Provider>
    ),
  ],
};

export const Default = () => (
  <RemoteModeSettings />
);
