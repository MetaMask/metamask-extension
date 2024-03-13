import React from 'react';
import { Provider } from 'react-redux';
import configureStore from '../../../store/store';
import testData from '../../../../.storybook/test-data';
import { BasicConfigurationModal } from '.';

const store = configureStore(testData);

export default {
  title: 'Components/BasicConfigurationModal',
  decorators: [(storyFn) => <Provider store={store}>{storyFn()}</Provider>],
  component: BasicConfigurationModal,
};

export const DefaultStory = () => <BasicConfigurationModal />;

DefaultStory.storyName = 'Default';
