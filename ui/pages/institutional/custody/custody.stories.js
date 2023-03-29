import React from 'react';
import { Provider } from 'react-redux';
import configureStore from '../../../store/store';
import testData from '../../../../.storybook/test-data';
import CustodyPage from '.';;

const store = configureStore(testData);

export default {
  title: 'Pages/Institutional/CustodyPage',
  decorators: [(story) => <Provider store={store}>{story()}</Provider>],
  component: CustodyPage,
  argTypes: {
    onClick: {
      action: 'onClick',
    },
    onChange: {
      action: 'onChange',
    }
  },
};

export const DefaultStory = (args) => <CustodyPage {...args} />;

DefaultStory.storyName = 'CustodyPage';
