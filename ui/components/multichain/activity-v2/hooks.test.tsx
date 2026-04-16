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
        value: '0x9184e72a000',
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

  it('returns sent for STANDARD outgoing native transfer with non-zero value', () => {
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
        from: selectedAddress,
        to: '0x316bde155acd07609872a56bc32ccfb0b13201fa',
        value: '0x6f05b59d3b20000',
      },
      amounts: {
        from: {
          token: {
            symbol: 'ETH',
            address: '0x0000000000000000000000000000000000000000',
            decimals: 18,
            chainId: '0x1',
          },
          amount: -500000000000000000n,
        },
      },
    } as unknown as TransactionViewModel;

    const { result } = renderHook(() => useGetTitle(tx), {
      wrapper: ({ children }) => <Provider store={store}>{children}</Provider>,
    });

    expect(result.current).toBe('sentSpecifiedTokens:ETH');
  });

  it('returns contractInteraction for zero-value STANDARD tx with no transfers', () => {
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
      valueTransfers: [],
      txParams: {
        from: selectedAddress,
        to: null,
        value: '0x0',
        data: '0x608060405234801561001057600080fd5b50',
      },
      amounts: {
        from: {
          token: {
            symbol: 'ETH',
            address: '0x0000000000000000000000000000000000000000',
            decimals: 18,
            chainId: '0x1',
          },
          amount: 0n,
        },
      },
    } as unknown as TransactionViewModel;

    const { result } = renderHook(() => useGetTitle(tx), {
      wrapper: ({ children }) => <Provider store={store}>{children}</Provider>,
    });

    expect(result.current).toBe('contractInteraction');
  });

  it('returns NFT approval title for ERC_721_APPROVE', () => {
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
      transactionCategory: 'APPROVE',
      transactionType: 'ERC_721_APPROVE',
      transactionProtocol: 'ERC_721',
      txParams: {
        from: selectedAddress,
        to: '0x3bb093106b26ff4afcf608249f0ddc72a73dcc6a',
      },
    } as unknown as TransactionViewModel;

    const { result } = renderHook(() => useGetTitle(tx), {
      wrapper: ({ children }) => <Provider store={store}>{children}</Provider>,
    });

    expect(result.current).toBe('confirmTitleApproveTransactionNFT');
  });

  it('returns setApprovalForAll titles based on approve/revoke', () => {
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

    const approveAllTx = {
      transactionCategory: 'APPROVE',
      transactionType: 'GENERIC_CONTRACT_CALL',
      transactionProtocol: 'erc721',
      txParams: {
        from: selectedAddress,
        data: '0xa22cb4650000000000000000000000002e0d7e8c45221fca00d74a3609a0f7097035d09b0000000000000000000000000000000000000000000000000000000000000001',
      },
    } as unknown as TransactionViewModel;

    const revokeAllTx = {
      transactionCategory: 'APPROVE',
      transactionType: 'GENERIC_CONTRACT_CALL',
      transactionProtocol: 'erc1155',
      txParams: {
        from: selectedAddress,
        data: '0xa22cb4650000000000000000000000002e0d7e8c45221fca00d74a3609a0f7097035d09b0000000000000000000000000000000000000000000000000000000000000000',
      },
    } as unknown as TransactionViewModel;

    const { result: approveAllResult } = renderHook(
      () => useGetTitle(approveAllTx),
      {
        wrapper: ({ children }) => (
          <Provider store={store}>{children}</Provider>
        ),
      },
    );
    expect(approveAllResult.current).toBe('setApprovalForAllRedesignedTitle');

    const { result: revokeAllResult } = renderHook(
      () => useGetTitle(revokeAllTx),
      {
        wrapper: ({ children }) => (
          <Provider store={store}>{children}</Provider>
        ),
      },
    );
    expect(revokeAllResult.current).toBe('revokePermissionTitle:token');
  });

  it('returns revoke title for selector-only setApprovalForAll payload', () => {
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
      transactionCategory: 'APPROVE',
      transactionType: 'ERC_721_APPROVE',
      transactionProtocol: 'ERC_721',
      methodId: '0xa22cb465',
    } as unknown as TransactionViewModel;

    const { result } = renderHook(() => useGetTitle(tx), {
      wrapper: ({ children }) => <Provider store={store}>{children}</Provider>,
    });

    expect(result.current).toBe('revokePermissionTitle:token');
  });
});
