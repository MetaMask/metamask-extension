import React from 'react';
import { DragDropContextProvider } from 'react-dnd';
import HTML5Backend from 'react-dnd-html5-backend';
import { Provider } from 'react-redux';
import configureStore from '../../../../store/store';
import testData from '../../../../../.storybook/test-data';

import ConfirmSeedPhrase from '.';

const store = configureStore(testData);

export default {
  title: 'Pages/FirstTimeFlow/SeedPhrase/ConfirmSeedPhrase',
  id: __filename,
  decorators: [(story) => <Provider store={store}>{story()}</Provider>],
  argTyps: {
    seedPhras: {
      control: 'text',
    },
  },
  args: {
    seedPhrase: 'hello this is not a seed phrase',
  },
};

export const DefaultStory = (args) => (
  <DragDropContextProvider backend={HTML5Backend} {...args}>
    <ConfirmSeedPhrase />
  </DragDropContextProvider>
);

DefaultStory.storyName = 'Default';
