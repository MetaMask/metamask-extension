import React from 'react';
import { Provider } from 'react-redux';
import configureStore from '../../../store/store';
import testData from '../../../../.storybook/test-data';
import ConfirmAddCustodianToken from '.';

const customData = {
  ...testData,
  metamask: {
    ...testData.metamask,
    institutionalFeatures: {
      connectRequests: [
        {
          labels: [
            {
              key: 'service',
              value: 'test',
            },
          ],
          origin: 'origin',
          token: 'awesomeTestToken',
          feature: 'custodian',
          service: 'Saturn',
          apiUrl: 'https://www.apiurl.net/v1',
          chainId: 1,
        },
      ],
    },
  },
};

const store = configureStore(customData);

export default {
  title: 'Pages/Institutional/ConfirmAddCustodianToken',
  decorators: [(story) => <Provider store={store}>{story()}</Provider>],
  component: ConfirmAddCustodianToken,
};

export const DefaultStory = () => <ConfirmAddCustodianToken />;

DefaultStory.storyName = 'ConfirmAddCustodianToken';
