import React from 'react';
import { Provider } from 'react-redux';
import { action } from '@storybook/addon-actions';
import configureStore from '../../../store/store';
import testData from '../../../../.storybook/test-data';
import ComplianceFeaturePage from '.';

const customData = {
  ...testData,
  metamask: {
    ...testData.metamask,
    institutionalFeatures: {
      complianceProjectId: '',
      complianceClientId: '',
      reportsInProgress: {},
    },
  },
};

const store = configureStore(customData);

export default {
  title: 'Pages/Institutional/ComplianceFeaturePage',
  decorators: [(story) => <Provider store={store}>{story()}</Provider>],
  component: ComplianceFeaturePage,
  args: {
    onClick: () => {
      action('onClick');
    },
  },
};

export const DefaultStory = (args) => <ComplianceFeaturePage {...args} />;

DefaultStory.storyName = 'ComplianceFeaturePage';
