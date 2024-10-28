import React from 'react';
import { Provider } from 'react-redux';
import { toHex } from '@metamask/controller-utils';
import configureStore from '../../../store/store';
import testData from '../../../../.storybook/test-data';
import WrongNetworkNotification from '.';
import { mockNetworkState } from '../../../../test/stub/networks';

const customData = {
  ...testData,
  metamask: {
    ...testData.metamask,
    ...mockNetworkState({ chainId: toHex(3) }),
    accountsByChainId: {
      [toHex(3)]: {
        '0x5Ab19e7091dD208F352F8E727B6DCC6F8aBB6275': { balance: '0x0' },
      },
    },
    custodianSupportedChains: {
      '0x5Ab19e7091dD208F352F8E727B6DCC6F8aBB6275': {
        supportedChains: ['1', '2'],
        custodianName: 'saturn',
      },
    },
    keyrings: [
      {
        type: 'Custody',
        accounts: ['0x5Ab19e7091dD208F352F8E727B6DCC6F8aBB6275'],
      },
    ],
  },
};

const store = configureStore(customData);

export default {
  title: 'Components/Institutional/WrongNetworkNotification',
  decorators: [(story: any) => <Provider store={store}>{story()}</Provider>],
  component: WrongNetworkNotification,
};

export const DefaultStory = () => {
  return <WrongNetworkNotification />;
};

DefaultStory.storyName = 'WrongNetworkNotification';
