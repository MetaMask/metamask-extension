import React from 'react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import configureStore from '../../../store/store';
import RemoteModeIntroducing from './remote-mode-walkthrough.container';
import testData from '../../../../.storybook/test-data';

const store = configureStore(testData);

export default {
  title: 'Pages/Vault/RemoteMode/Walkthrough',
  component: RemoteModeIntroducing,
  id: 'pages-remote-mode-walkthrough--docs',
  decorators: [
    (story) => (
      <Provider store={store}>
        <MemoryRouter>{story()}</MemoryRouter>
      </Provider>
    ),
  ],
};

export const Default = () => (
  <RemoteModeIntroducing />
);
