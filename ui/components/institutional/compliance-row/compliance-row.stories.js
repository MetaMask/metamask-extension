import React from 'react';
import { Provider } from 'react-redux';
import configureStore from '../../../store/store';
import testData from '../../../../.storybook/test-data';
import ComplianceRow from '.';

const customData = {
  ...testData,
  metamask: {
    ...testData.metamask,
    institutionalFeatures: {
      historicalReports: {
        '0xAddress': [
          {
            reportId: 'reportId',
            address: '0xAddress',
            risk: 'low',
            createTime: new Date(),
          },
          {
            reportId: 'reportId2',
            address: '0xAddress',
            risk: 'low',
            createTime: new Date(),
          },
        ],
      },
      /* Uncomment to show reports in progress */
      // reportsInProgress: {
      //   '0xaddress': [
      //     {
      //       reportId: 'reportId',
      //       address: '0xAddress',
      //       risk: 'low',
      //       createTime: new Date(),
      //     },
      //     {
      //       reportId: 'reportId2',
      //       address: '0xAddress',
      //       risk: 'low',
      //       createTime: new Date(),
      //     },
      //   ],
      // },
    },
  },
};

const store = configureStore(customData);

export default {
  title: 'Components/Institutional/ComplianceRow',
  decorators: [(story) => <Provider store={store}>{story()}</Provider>],
  component: ComplianceRow,
  args: {
    address: '0xaddress',
    rowClick: () => undefined,
    inProgress: false,
  },
  argTypes: {
    onClick: {
      action: 'onClick',
    },
  },
};

export const DefaultStory = (args) => <ComplianceRow {...args} />;

DefaultStory.storyName = 'ComplianceRow';
