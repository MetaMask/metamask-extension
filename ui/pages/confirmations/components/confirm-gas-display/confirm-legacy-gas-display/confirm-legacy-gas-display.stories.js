import React from 'react';
import { Provider } from 'react-redux';

import mockState from '../../../../../../test/data/mock-state.json';
import configureStore from '../../../../../store/store';

import README from './README.mdx';
import ConfirmLegacyGasDisplay from './confirm-legacy-gas-display';

const store = configureStore(mockState);

export default {
  title: 'Confirmations/Components/ConfirmLegacyGasDisplay',

  component: ConfirmLegacyGasDisplay,
  decorators: [(story) => <Provider store={store}>{story()}</Provider>],
  parameters: {
    docs: {
      page: README,
    },
  },
};

export const DefaultStory = () => {
  return <ConfirmLegacyGasDisplay />;
};

DefaultStory.storyName = 'Default';
