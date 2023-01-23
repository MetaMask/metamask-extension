import React from 'react';
import { Provider } from 'react-redux';
import { object } from '@storybook/addon-knobs';
import { panel, text, heading, divider, copyable } from '@metamask/snaps-ui';
import configureStore from '../../../../store/store';
import testData from '../../../../../.storybook/test-data';
import { SnapUIRenderer } from '.';

const store = configureStore(testData);

export default {
  title: 'Components/App/SnapUIRenderer',

  decorators: [(story) => <Provider store={store}>{story()}</Provider>],
};

const DATA = panel([
  heading('Foo bar'),
  text('Description'),
  divider(),
  text('More text'),
  copyable('Text you can copy'),
]);

export const DefaultStory = () => (
  <SnapUIRenderer
    snapId="local:http://localhost:8080/"
    data={object('data', DATA)}
  />
);

export const ErrorStory = () => (
  <SnapUIRenderer snapId="local:http://localhost:8080/" data="foo" />
);
