import React from 'react';
import { Provider } from 'react-redux';
import { renderHook } from '@testing-library/react-hooks';
import { EthAccountType } from '@metamask/keyring-api';

import configureStore from '../../../store/store';
import { ETH_EOA_METHODS } from '../../../../shared/constants/eth-methods';
import { CHAIN_IDS } from '../../../../shared/constants/network';
import { mockNetworkState } from '../../../../test/stub/networks';
import { useBalance } from './useBalance';

const MOCK_ADDRESS = '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc';
const MOCK_CHECKSUM_ADDRESS = '0x0DCD5D886577d5081B0c52e242Ef29E70bE3E7bc';
const GOERLI_BALANCE = '0xa';
const MAINNET_BALANCE = '0xff';

const renderUseBalance = (fromAddress, chainId, stateVariables = {}) => {
  const mockState = {
    metamask: {
      ...mockNetworkState({ chainId: CHAIN_IDS.GOERLI }),
      currentCurrency: 'ETH',
      tokenList: {},
      accountsByChainId: {
        '0x5': {
          [MOCK_CHECKSUM_ADDRESS]: {
            balance: GOERLI_BALANCE,
          },
        },
        '0x1': {
          [MOCK_CHECKSUM_ADDRESS]: {
            balance: MAINNET_BALANCE,
          },
        },
      },
      internalAccounts: {
        accounts: {
          'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3': {
            address: MOCK_ADDRESS,
            id: 'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3',
            methods: ETH_EOA_METHODS,
            type: EthAccountType.Eoa,
          },
        },
        selectedAccount: 'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3',
      },
      enabledNetworkMap: {
        eip155: {
          '0x5': true,
        },
      },
      isEvmSelected: true,
      ...mockNetworkState({ chainId: CHAIN_IDS.GOERLI }),
      ...stateVariables,
    },
  };

  const wrapper = ({ children }) => (
    <Provider store={configureStore(mockState)}>{children}</Provider>
  );

  return renderHook(() => useBalance(fromAddress, chainId), { wrapper });
};

describe('useBalance', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns empty object if no address is passed', () => {
    const { result } = renderUseBalance();
    expect(result.current).toStrictEqual({});
  });

  it('returns balance for the selected network when no chainId is provided', () => {
    const { result } = renderUseBalance(MOCK_ADDRESS);
    expect(result.current).toStrictEqual({ balance: GOERLI_BALANCE });
  });

  describe('when chainId is provided', () => {
    it('returns the native balance for the specified chain', () => {
      const { result } = renderUseBalance(MOCK_ADDRESS, CHAIN_IDS.MAINNET);
      expect(result.current).toStrictEqual({ balance: MAINNET_BALANCE });
    });

    it('returns the native balance for Goerli when Goerli chainId is specified', () => {
      const { result } = renderUseBalance(MOCK_ADDRESS, CHAIN_IDS.GOERLI);
      expect(result.current).toStrictEqual({ balance: GOERLI_BALANCE });
    });

    it('returns 0x0 for a chain with no balance data', () => {
      const { result } = renderUseBalance(MOCK_ADDRESS, '0x89');
      expect(result.current).toStrictEqual({ balance: '0x0' });
    });

    it('returns empty object if address is not provided even with chainId', () => {
      const { result } = renderUseBalance(undefined, CHAIN_IDS.MAINNET);
      expect(result.current).toStrictEqual({});
    });
  });
});
