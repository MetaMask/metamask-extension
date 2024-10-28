import React from 'react';
import { Provider } from 'react-redux';
import { renderHook } from '@testing-library/react-hooks';
import { EthAccountType } from '@metamask/keyring-api';

import configureStore from '../store/store';
import { ETH_EOA_METHODS } from '../../shared/constants/eth-methods';
import { CHAIN_IDS } from '../../shared/constants/network';
import { mockNetworkState } from '../../test/stub/networks';
import useAddressDetails from './useAddressDetails';

const renderUseAddressDetails = (toAddress, stateVariables = {}) => {
  const mockState = {
    metamask: {
      ...mockNetworkState({ chainId: CHAIN_IDS.GOERLI }),

      tokenList: {},
      internalAccounts: {
        accounts: {
          'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3': {
            address: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
            id: 'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3',
            metadata: {
              name: 'Test Account',
              keyring: {
                type: 'HD Key Tree',
              },
            },
            options: {},
            methods: ETH_EOA_METHODS,
            type: EthAccountType.Eoa,
          },
        },
        selectedAccount: 'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3',
      },
      ...stateVariables,
    },
  };

  const wrapper = ({ children }) => (
    <Provider store={configureStore(mockState)}>{children}</Provider>
  );

  return renderHook(() => useAddressDetails(toAddress), { wrapper });
};

describe('useAddressDetails', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return empty object if no address is passed', () => {
    const { result } = renderUseAddressDetails();
    expect(result.current).toStrictEqual({});
  });

  it('should return name from addressBook if address is present in addressBook', () => {
    const { result } = renderUseAddressDetails(
      '0x06195827297c7A80a443b6894d3BDB8824b43896',
      {
        addressBook: {
          '0x5': {
            '0x06195827297c7A80a443b6894d3BDB8824b43896': {
              address: '0x06195827297c7A80a443b6894d3BDB8824b43896',
              name: 'Address Book Account 1',
              chainId: '0x5',
            },
          },
        },
      },
    );
    const { toName, isTrusted } = result.current;
    expect(toName).toBe('Address Book Account 1');
    expect(isTrusted).toBe(true);
  });

  it('should return name from internal account if address is present in internalAccounts', () => {
    const { result } = renderUseAddressDetails(
      '0x06195827297c7A80a443b6894d3BDB8824b43896',
      {
        internalAccounts: {
          accounts: {
            'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3': {
              address: '0x06195827297c7A80a443b6894d3BDB8824b43896',
              id: 'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3',
              metadata: {
                name: 'Account 1',
                keyring: {
                  type: 'HD Key Tree',
                },
              },
              options: {},
              methods: ETH_EOA_METHODS,
              type: EthAccountType.Eoa,
            },
          },
          selectedAccount: 'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3',
        },
      },
    );
    const { toName, isTrusted } = result.current;
    expect(toName).toBe('Account 1');
    expect(isTrusted).toBe(true);
  });

  it('should return name from tokenlist if address is present in tokens', () => {
    const { result } = renderUseAddressDetails(
      '0x06195827297c7A80a443b6894d3BDB8824b43896',
      {
        useTokenDetection: true,
        tokenList: {
          '0x06195827297c7a80a443b6894d3bdb8824b43896': {
            address: '0x06195827297c7a80a443b6894d3bdb8824b43896',
            symbol: 'LINK',
            decimals: 18,
            name: 'TOKEN-ABC',
          },
        },
      },
    );
    const { toName, isTrusted } = result.current;
    expect(toName).toBe('TOKEN-ABC');
    expect(isTrusted).toBe(true);
  });

  it('should return shortened address if address is not presend in any of above sources', () => {
    const { result } = renderUseAddressDetails(
      '0x06195827297c7A80a443b6894d3BDB8824b43896',
    );
    const { toName, isTrusted } = result.current;
    expect(toName).toBe('0x06195...43896');
    expect(isTrusted).toBe(false);
  });
});
