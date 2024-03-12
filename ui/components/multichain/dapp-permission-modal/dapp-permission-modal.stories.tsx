import React from 'react';
import { Provider } from 'react-redux';
import configureStore from '../../../store/store';
import testData from '../../../../.storybook/test-data';
import { DappPermissionModal } from '.';

const store = configureStore(testData);

export default {
  title: 'Components/DappPermissionModal',
  decorators: [(storyFn) => <Provider store={store}>{storyFn()}</Provider>],
  component: DappPermissionModal,
};

export const DefaultStory = () => <DappPermissionModal />;

DefaultStory.storyName = 'Default';
