import React from 'react';
import configureMockStore from 'redux-mock-store';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import testData from '../../../../.storybook/test-data';
import WrongNetworkNotification from '.';

jest.mock('../../../../shared/modules/hash.utils');

describe('Wrong Network Notification', function () {
  const mockStore = {
    ...testData,
    metamask: {
      ...testData.metamask,
      providerConfig: {
        type: 'test',
        chainId: '3',
      },
      selectedAddress: '0x5Ab19e7091dD208F352F8E727B6DCC6F8aBB6275',
      cachedBalances: {
        '0x1': {
          '0x5Ab19e7091dD208F352F8E727B6DCC6F8aBB6275': '0x0',
        },
      },
      custodianSupportedChains: {
        '0x5Ab19e7091dD208F352F8E727B6DCC6F8aBB6275': {
          supportedChains: ['1', '2'],
          custodianName: 'saturn',
        },
      },
      internalAccounts: {
        accounts: {
          'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3': {
            address: '0x5Ab19e7091dD208F352F8E727B6DCC6F8aBB6275',
            id: 'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3',
            metadata: {
              keyring: {
                type: 'Custody',
              },
            },
            name: 'Custody Account A',
            options: {},
            supportedMethods: [
              'personal_sign',
              'eth_sendTransaction',
              'eth_sign',
              'eth_signTransaction',
              'eth_signTypedData',
              'eth_signTypedData_v1',
              'eth_signTypedData_v2',
              'eth_signTypedData_v3',
              'eth_signTypedData_v4',
            ],
            type: 'eip155:eoa',
          },
        },
        selectedAccount: 'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3',
      },
      keyrings: [
        {
          type: 'Custody',
          accounts: ['0x5Ab19e7091dD208F352F8E727B6DCC6F8aBB6275'],
        },
      ],
    },
  };

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('should not render if balance is empty', () => {
    const store = configureMockStore()(mockStore);

    const { container } = renderWithProvider(
      <WrongNetworkNotification />,
      store,
    );

    expect(container.firstChild).toBeNull();
  });

  it('should not render if has a balance and custodian is in correct network', () => {
    const customData = {
      ...mockStore,
      metamask: {
        ...mockStore.metamask,
        providerConfig: {
          type: 'test',
          chainId: '3',
        },
        cachedBalances: {
          '0x1': {
            '0x5Ab19e7091dD208F352F8E727B6DCC6F8aBB6275': '0x0',
          },
        },
      },
    };
    const store = configureMockStore()(customData);

    const { container } = renderWithProvider(
      <WrongNetworkNotification />,
      store,
    );

    expect(container.firstChild).toBeNull();
  });

  it('should render if has a balance but custodian is in wrong network', () => {
    const customData = {
      ...mockStore,
      metamask: {
        ...mockStore.metamask,
        providerConfig: {
          type: 'test',
          chainId: '3',
        },
        cachedBalances: {
          3: {
            '0x5Ab19e7091dD208F352F8E727B6DCC6F8aBB6275': '0x0',
          },
        },
      },
    };
    const store = configureMockStore()(customData);

    const { getByTestId } = renderWithProvider(
      <WrongNetworkNotification />,
      store,
    );

    expect(getByTestId('wrong-network-notification')).toBeInTheDocument();
  });
});
