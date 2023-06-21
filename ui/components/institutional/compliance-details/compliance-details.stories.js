import React from 'react';
import { Provider } from 'react-redux';
import configureStore from '../../../store/store';
import testData from '../../../../.storybook/test-data';
import ComplianceDetails from '.';

const customData = {
  ...testData,
  metamask: {
    institutionalFeatures: {
      complianceProjectId: '',
      complianceClientId: '',
      reportsInProgress: {},
      historicalReports: {
        '0xAddress': [
          {
            reportId: 'reportId',
            address: '0xAddress',
            risk: 'low',
            creatTime: new Date(),
          },
        ],
      },
    },
  },
};

const store = configureStore(customData);

export default {
  title: 'Components/Institutional/ComplianceDetails',
  decorators: [(story) => <Provider store={store}>{story()}</Provider>],
  component: ComplianceDetails,
  args: {
    address: '0xAddress',
    onClose: () => undefined,
    onGenerate: () => undefined,
  },
  argTypes: {
    onClick: {
      action: 'onClick',
    },
  },
};

export const DefaultStory = (args) => <ComplianceDetails {...args} />;

DefaultStory.storyName = 'ComplianceDetails';
