import React from 'react';
import { Provider } from 'react-redux';
import { renderHook } from '@testing-library/react-hooks';
import { EthAccountType, EthMethod } from '@metamask/keyring-api';

import configureStore from '../../../store/store';
import { useBalance } from './useBalance';

const renderUseBalance = (fromAddress, stateVariables = {}) => {
  const mockState = {
    metamask: {
      providerConfig: {
        type: 'rpc',
        chainId: '0x5',
        ticker: 'ETH',
      },
      networkConfigurations: {
        5: {
          nickname: 'Goerli',
        },
      },
      currentCurrency: 'ETH',
      tokenList: {},
      accountsByChainId: {
        '0x5': {
          '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc': {
            balance: '0xa',
          },
        },
      },
      internalAccounts: {
        accounts: {
          'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3': {
            address: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
            id: 'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3',
            methods: [...Object.values(EthMethod)],
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

  return renderHook(() => useBalance(fromAddress), { wrapper });
};

describe('useBalanceToUse', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return empty object if no address is passed', () => {
    const { result } = renderUseBalance();
    expect(result.current).toStrictEqual({});
  });

  it('should return balance', () => {
    const { result } = renderUseBalance(
      '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
    );
    expect(result.current).toStrictEqual({ balance: '0xa' });
  });
});
