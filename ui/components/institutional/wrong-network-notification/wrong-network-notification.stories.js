import React from 'react';
import { Provider } from 'react-redux';
import { toHex } from '@metamask/controller-utils';
import configureStore from '../../../store/store';
import testData from '../../../../.storybook/test-data';
import WrongNetworkNotification from '.';

const customData = {
  ...testData,
  metamask: {
    ...testData.metamask,
    providerConfig: {
      type: 'test',
      chainId: toHex(3),
    },
    cachedBalances: {
      [toHex(3)]: {
        '0x5Ab19e7091dD208F352F8E727B6DCC6F8aBB6275': '0x0',
      },
    },
    selectedAddress: '0x5Ab19e7091dD208F352F8E727B6DCC6F8aBB6275',
    custodianSupportedChains: {
      '0x5Ab19e7091dD208F352F8E727B6DCC6F8aBB6275': {
        supportedChains: ['1', '2'],
        custodianName: 'saturn',
      },
    },
    identities: {
      '0x5Ab19e7091dD208F352F8E727B6DCC6F8aBB6275': {
        name: 'Custody Account A',
        address: '0x5Ab19e7091dD208F352F8E727B6DCC6F8aBB6275',
      },
    },
    internalAccounts: {
      accounts: {
        '95a689e2-2e85-49a1-80e0-caf609c3a950': {
          address: '0xca8f1F0245530118D0cf14a06b01Daf8f76Cf281',
          id: '95a689e2-2e85-49a1-80e0-caf609c3a950',
          metadata: {
            name: 'Custodian Account A',
            keyring: {
              type: 'Custody',
            },
          },
          options: {},
          methods: [
            'personal_sign',
            'eth_sign',
            'eth_signTransaction',
            'eth_signTypedData_v1',
            'eth_signTypedData_v3',
            'eth_signTypedData_v4',
          ],
          type: 'eip155:eoa',
        },
      },
      selectedAccount: '95a689e2-2e85-49a1-80e0-caf609c3a950',
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
  decorators: [(story) => <Provider store={store}>{story()}</Provider>],
  component: WrongNetworkNotification,
};

export const DefaultStory = () => {
  return <WrongNetworkNotification />;
};

DefaultStory.storyName = 'WrongNetworkNotification';
