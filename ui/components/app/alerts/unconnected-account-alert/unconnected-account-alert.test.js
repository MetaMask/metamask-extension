import React from 'react';

import sinon from 'sinon';
import thunk from 'redux-thunk';

import { fireEvent } from '@testing-library/react';
import configureMockStore from 'redux-mock-store';

import { tick } from '../../../../../test/lib/timer-helpers';
import { renderWithProvider } from '../../../../../test/lib/render-helpers';

import * as actions from '../../../../store/actions';
import { CHAIN_IDS } from '../../../../../shared/constants/network';
import { KeyringType } from '../../../../../shared/constants/keyring';

import { mockNetworkState } from '../../../../../test/stub/networks';
import UnconnectedAccountAlert from '.';

describe('Unconnected Account Alert', () => {
  const selectedAddress = '0xec1adf982415d2ef5ec55899b9bfb8bc0f29251b';

  const identities = {
    '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc': {
      address: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
      name: 'Account 1',
    },
    '0xec1adf982415d2ef5ec55899b9bfb8bc0f29251b': {
      address: '0xec1adf982415d2ef5ec55899b9bfb8bc0f29251b',
      name: 'Account 2',
    },
  };

  const accounts = {
    '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc': {
      address: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
      balance: '0x0',
    },
    '0xec1adf982415d2ef5ec55899b9bfb8bc0f29251b': {
      address: '0xec1adf982415d2ef5ec55899b9bfb8bc0f29251b',
      balance: '0x0',
    },
  };

  const accountsByChainId = {
    [CHAIN_IDS.MAINNET]: {
      '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc': { balance: '0x0' },
      '0xec1adf982415d2ef5ec55899b9bfb8bc0f29251b': { balance: '0x0' },
    },
  };

  const keyrings = [
    {
      type: KeyringType.hdKeyTree,
      accounts: [
        '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
        '0xec1adf982415d2ef5ec55899b9bfb8bc0f29251b',
      ],
    },
  ];

  const internalAccounts = {
    accounts: {
      'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3': {
        address: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
        id: 'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3',
        metadata: {
          name: 'Account 1',
          keyring: {
            type: 'HD Key Tree',
          },
        },
        options: {},
        methods: [
          'personal_sign',
          'eth_signTransaction',
          'eth_signTypedData_v1',
          'eth_signTypedData_v3',
          'eth_signTypedData_v4',
        ],
        type: 'eip155:eoa',
      },
      '07c2cfec-36c9-46c4-8115-3836d3ac9047': {
        address: '0xec1adf982415d2ef5ec55899b9bfb8bc0f29251b',
        id: '07c2cfec-36c9-46c4-8115-3836d3ac9047',
        metadata: {
          name: 'Account 2',
          keyring: {
            type: 'HD Key Tree',
          },
        },
        options: {},
        methods: [
          'personal_sign',
          'eth_signTransaction',
          'eth_signTypedData_v1',
          'eth_signTypedData_v3',
          'eth_signTypedData_v4',
        ],
        type: 'eip155:eoa',
      },
    },
    selectedAccount: 'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3',
  };

  const mockState = {
    metamask: {
      selectedAddress,
      identities,
      internalAccounts,
      accounts,
      accountsByChainId,
      keyrings,
      ...mockNetworkState({ chainId: CHAIN_IDS.MAINNET }),
      permissionHistory: {
        'https://test.dapp': {
          eth_accounts: {
            accounts: {
              '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc': 1596681857076,
            },
          },
        },
      },
      subjects: {
        'https://test.dapp': {
          permissions: {
            'endowment:caip25': {
              caveats: [
                {
                  type: 'authorizedScopes',
                  value: {
                    requiredScopes: {},
                    optionalScopes: {
                      'eip155:1': {
                        accounts: [
                          'eip155:1:0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
                        ],
                      },
                    },
                    isMultichainOrigin: false,
                  },
                },
              ],
              invoker: 'https://test.dapp',
              parentCapability: 'endowment:caip25',
            },
          },
        },
      },
    },
    activeTab: {
      origin: 'https://test.dapp',
    },
    unconnectedAccount: {
      state: 'OPEN',
    },
  };

  afterEach(() => {
    sinon.restore();
  });

  it('checks that checkbox is checked', () => {
    const store = configureMockStore()(mockState);

    const { getByRole } = renderWithProvider(
      <UnconnectedAccountAlert />,
      store,
    );

    const dontShowCheckbox = getByRole('checkbox');

    expect(dontShowCheckbox.checked).toStrictEqual(false);
    fireEvent.click(dontShowCheckbox);
    expect(dontShowCheckbox.checked).toStrictEqual(true);
  });

  it('clicks dismiss button and calls dismissAlert action', () => {
    const store = configureMockStore()(mockState);

    const { getByText } = renderWithProvider(
      <UnconnectedAccountAlert />,
      store,
    );

    const dismissButton = getByText(/Dismiss/u);
    fireEvent.click(dismissButton);

    expect(store.getActions()[0].type).toStrictEqual(
      'unconnectedAccount/dismissAlert',
    );
  });

  it('clicks Dont Show checkbox and dismiss to call disable alert request action', async () => {
    sinon.stub(actions, 'setAlertEnabledness').returns(() => Promise.resolve());

    const store = configureMockStore([thunk])(mockState);

    const { getByText, getByRole } = renderWithProvider(
      <UnconnectedAccountAlert />,
      store,
    );

    const dismissButton = getByText(/Dismiss/u);
    const dontShowCheckbox = getByRole('checkbox');

    fireEvent.click(dontShowCheckbox);
    fireEvent.click(dismissButton);

    await tick();

    expect(store.getActions()[0].type).toStrictEqual(
      'unconnectedAccount/disableAlertRequested',
    );
    expect(store.getActions()[1].type).toStrictEqual(
      'unconnectedAccount/disableAlertSucceeded',
    );
  });
});
