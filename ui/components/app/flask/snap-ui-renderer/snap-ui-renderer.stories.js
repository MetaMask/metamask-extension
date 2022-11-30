import React from 'react';
import { Provider } from 'react-redux';
import { object } from '@storybook/addon-knobs';
import { panel, text, heading, divider } from '@metamask/snaps-ui';
import configureStore from '../../../../store/store';
import testData from '../../../../../.storybook/test-data';
import { SnapUIRenderer } from '.';

const store = configureStore(testData);

export default {
  title: 'Components/App/SnapUIRenderer',
  id: __filename,
  decorators: [(story) => <Provider store={store}>{story()}</Provider>],
};

const DATA = panel([
  heading('Foo bar'),
  text('Description'),
  divider(),
  text('More text'),
]);

export const DefaultStory = () => (
  <SnapUIRenderer
    snapId="local:http://localhost:8080/"
    data={object('data', DATA)}
  />
);
