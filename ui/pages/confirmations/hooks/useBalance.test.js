import React from 'react';
import { Provider } from 'react-redux';
import { renderHook } from '@testing-library/react';
import { EthAccountType } from '@metamask/keyring-api';

import configureStore from '../../../store/store';
import { ETH_EOA_METHODS } from '../../../../shared/constants/eth-methods';
import { CHAIN_IDS } from '../../../../shared/constants/network';
import { mockNetworkState } from '../../../../test/stub/networks';
import {
  MOCK_CONFIRMATIONS_ACCOUNT_ID,
  nativeEvmAssetId,
  weiToAssetAmount,
} from '../../../../test/data/confirmations/helper';
import { useBalance } from './useBalance';

const ACCOUNT_ADDRESS = '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc';
const NATIVE_ASSET_ID = nativeEvmAssetId(CHAIN_IDS.GOERLI);

const renderUseBalance = (fromAddress, stateVariables = {}) => {
  const mockState = {
    metamask: {
      ...mockNetworkState({ chainId: CHAIN_IDS.GOERLI }),
      selectedCurrency: 'ETH',
      tokenList: {},
      assetsInfo: {
        [NATIVE_ASSET_ID]: {
          type: 'native',
          decimals: 18,
          symbol: 'ETH',
        },
      },
      assetsBalance: {
        [MOCK_CONFIRMATIONS_ACCOUNT_ID]: {
          // 0xa wei
          [NATIVE_ASSET_ID]: { amount: weiToAssetAmount('0xa') },
        },
      },
      internalAccounts: {
        accounts: {
          [MOCK_CONFIRMATIONS_ACCOUNT_ID]: {
            address: ACCOUNT_ADDRESS,
            id: MOCK_CONFIRMATIONS_ACCOUNT_ID,
            methods: ETH_EOA_METHODS,
            type: EthAccountType.Eoa,
          },
        },
        selectedAccount: MOCK_CONFIRMATIONS_ACCOUNT_ID,
      },
      accountIdByAddress: {
        [ACCOUNT_ADDRESS]: MOCK_CONFIRMATIONS_ACCOUNT_ID,
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

  return renderHook(() => useBalance(fromAddress), { wrapper });
};

describe('useBalanceToUse', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns empty object if no address is passed', () => {
    const { result } = renderUseBalance();
    expect(result.current).toStrictEqual({});
  });

  it('returns balance', () => {
    const { result } = renderUseBalance(ACCOUNT_ADDRESS);
    expect(result.current).toStrictEqual({ balance: '0xa' });
  });
});
