import React from 'react';
import { Provider } from 'react-redux';
import configureMockStore from 'redux-mock-store';
import { renderHook } from '@testing-library/react-hooks';
import type { TransactionViewModel } from '../../../../shared/lib/multichain/types';
import { useGetTitle } from './hooks';

jest.mock('../../../hooks/useI18nContext', () => ({
  useI18nContext: () => (key: string, args?: string[]) =>
    args?.length ? `${key}:${args.join(',')}` : key,
}));

describe('useGetTitle', () => {
  it('returns swap title for swap-like CONTRACT_CALL', () => {
    const selectedAddress = '0x4f5243ceea96cee1da0fdb89c756d0e999439424';

    const store = configureMockStore()({
      metamask: {
        internalAccounts: {
          selectedAccount: '1',
          accounts: {
            '1': {
              address: selectedAddress,
              type: 'eip155:eoa',
            },
          },
        },
      },
    });

    const tx = {
      transactionCategory: 'CONTRACT_CALL',
      transactionType: 'GENERIC_CONTRACT_CALL',
      transactionProtocol: '',
      txParams: {
        from: selectedAddress,
        to: selectedAddress,
      },
      amounts: {
        from: {
          token: {
            symbol: 'USDC',
            address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
            decimals: 6,
            chainId: '0x1',
          },
          amount: -100000n,
        },
        to: {
          token: {
            symbol: 'USDT',
            address: '0xdac17f958d2ee523a2206206994597c13d831ec7',
            decimals: 6,
            chainId: '0x1',
          },
          amount: 99857n,
        },
      },
    } as unknown as TransactionViewModel;

    const { result } = renderHook(() => useGetTitle(tx), {
      wrapper: ({ children }) => <Provider store={store}>{children}</Provider>,
    });

    expect(result.current).toBe('swapTokenToToken:USDC,USDT');
  });

  it('returns received for STANDARD incoming native transfer', () => {
    const selectedAddress = '0x4f5243ceea96cee1da0fdb89c756d0e999439424';

    const store = configureMockStore()({
      metamask: {
        internalAccounts: {
          selectedAccount: '1',
          accounts: {
            '1': {
              address: selectedAddress,
              type: 'eip155:eoa',
            },
          },
        },
      },
    });

    const tx = {
      transactionCategory: 'STANDARD',
      transactionType: 'STANDARD',
      transactionProtocol: '',
      txParams: {
        from: '0x316bde155acd07609872a56bc32ccfb0b13201fa',
        to: selectedAddress,
      },
      amounts: {
        to: {
          token: {
            symbol: 'ETH',
            address: '0x0000000000000000000000000000000000000000',
            decimals: 18,
            chainId: '0x1',
          },
          amount: 10000000000000n,
        },
      },
    } as unknown as TransactionViewModel;

    const { result } = renderHook(() => useGetTitle(tx), {
      wrapper: ({ children }) => <Provider store={store}>{children}</Provider>,
    });

    expect(result.current).toBe('received');
  });
});
