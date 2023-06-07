import React from 'react';
import { Provider } from 'react-redux';
import configureStore from '../../../store/store';
import testData from '../../../../.storybook/test-data';
import ComplianceModal from '.';

const store = configureStore(testData);

export default {
  title: 'Components/Institutional/ComplianceModal',
  decorators: [(story) => <Provider store={store}>{story()}</Provider>],
  component: ComplianceModal,
  argTypes: {
    onClick: {
      action: 'onClick',
    },
  },
};

export const DefaultStory = (args) => <ComplianceModal {...args} />;

DefaultStory.storyName = 'ComplianceModal';
