import React from 'react';
import { Provider } from 'react-redux';
import configureStore from '../../../store/store';
import testData from '../../../../.storybook/test-data';
import ConfirmAddInstitutionalFeature from '.';

const customData = {
  ...testData,
  metamask: {
    providerConfig: {
      type: 'test',
    },
    institutionalFeatures: {
      complianceProjectId: '',
      connectRequests: [
        {
          labels: [
            {
              key: 'service',
              value: 'test',
            },
          ],
          origin: 'origin',
          token: {
            projectName: 'projectName',
            projectId: 'projectId',
            clientId: 'clientId',
          },
        },
      ],
    },
    preferences: {
      useNativeCurrencyAsPrimaryCurrency: true,
    },
  },
};

const store = configureStore(customData);

export default {
  title: 'Pages/Institutional/ConfirmAddInstitutionalFeature',
  decorators: [(story) => <Provider store={store}>{story()}</Provider>],
  component: ConfirmAddInstitutionalFeature,
  args: {
    history: {
      push: () => {
        /**/
      },
    },
  },
};

export const DefaultStory = (args) => (
  <ConfirmAddInstitutionalFeature {...args} />
);

DefaultStory.storyName = 'ConfirmAddInstitutionalFeature';
