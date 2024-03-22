import React from 'react';
import { Provider } from 'react-redux';
import configureStore from '../../../../store/store';
import testData from '../../../../../.storybook/test-data';
import { SnapUIRenderer } from '.';

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

export const ErrorStory = () => (
  <SnapUIRenderer
    snapId="local:http://localhost:8080/"
    interfaceId="error-interface"
  />
);
