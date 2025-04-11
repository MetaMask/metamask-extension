import React from 'react';
import { Provider } from 'react-redux';

import { SnapUIRenderer } from '.';
import testData from '../../../../../.storybook/test-data';
import configureStore from '../../../../store/store';

const store = configureStore(testData);

export default {
  title: 'Components/App/SnapUIRenderer',
  component: SnapUIRenderer,
  decorators: [(story) => <Provider store={store}>{story()}</Provider>],
};

export const DefaultStory = () => (
  <SnapUIRenderer
    snapId="local:http://localhost:8080/"
    interfaceId="test-interface"
  />
);
