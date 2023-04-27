import React from 'react';
import { Provider } from 'react-redux';
import configureStore from '../../../store/store';
import testData from '../../../../.storybook/test-data';
import CustodyPage from '.';

const customData = {
  ...testData,
  metamask: {
    ...testData.metamask,
    mmiConfiguration: {
      portfolio: {
        enabled: true,
        url: 'https://portfolio.io',
      },
      custodians: [
        {
          type: 'Saturn',
          name: 'saturn',
          apiUrl: 'https://saturn-custody.dev.metamask-institutional.io',
          iconUrl:
            'https://saturn-custody-ui.dev.metamask-institutional.io/saturn.svg',
          displayName: 'Saturn Custody',
          production: true,
          refreshTokenUrl: null,
          isNoteToTraderSupported: false,
          version: 1,
        },
      ],
    },
  },
};

const store = configureStore(customData);

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
    },
  },
};

export const DefaultStory = (args) => <CustodyPage {...args} />;

DefaultStory.storyName = 'CustodyPage';
