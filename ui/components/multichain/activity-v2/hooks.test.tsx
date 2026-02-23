import React from 'react';
import { Provider } from 'react-redux';
import configureMockStore from 'redux-mock-store';
import { renderHook as renderHookBase } from '@testing-library/react-hooks';
import type { TransactionViewModel } from '../../../../shared/lib/multichain/types';
import { useGetTitle } from './hooks';

jest.mock('../../../hooks/useI18nContext', () => ({
  useI18nContext: () => (key: string, args?: string[]) =>
    args?.length ? `${key}:${args.join(',')}` : key,
}));

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

function renderHook<Result>(callback: () => Result) {
  return renderHookBase(callback, {
    wrapper: ({ children }) => <Provider store={store}>{children}</Provider>,
  });
}

describe('useGetTitle', () => {
  it('returns swap title for swap-like CONTRACT_CALL', () => {
    const tx = {
      amounts: {
        from: {
          amount: -100000n,
          token: {
            address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
            chainId: '0x1',
            decimals: 6,
            symbol: 'USDC',
          },
        },
        to: {
          amount: 99857n,
          token: {
            address: '0xdac17f958d2ee523a2206206994597c13d831ec7',
            chainId: '0x1',
            decimals: 6,
            symbol: 'USDT',
          },
        },
      },
      transactionCategory: 'CONTRACT_CALL',
      transactionProtocol: '',
      transactionType: 'GENERIC_CONTRACT_CALL',
      txParams: {
        from: selectedAddress,
        to: selectedAddress,
      },
    } as unknown as TransactionViewModel;

    const { result } = renderHook(() => useGetTitle(tx));

    expect(result.current).toBe('swapTokenToToken:USDC,USDT');
  });

  it('returns received for STANDARD incoming native transfer', () => {
    const tx = {
      amounts: {
        to: {
          amount: 10000000000000n,
          token: {
            address: '0x0000000000000000000000000000000000000000',
            chainId: '0x1',
            decimals: 18,
            symbol: 'ETH',
          },
        },
      },
      transactionCategory: 'STANDARD',
      transactionProtocol: '',
      transactionType: 'STANDARD',
      txParams: {
        from: '0x316bde155acd07609872a56bc32ccfb0b13201fa',
        to: selectedAddress,
        value: '0x9184e72a000',
      },
    } as unknown as TransactionViewModel;

    const { result } = renderHook(() => useGetTitle(tx));

    expect(result.current).toBe('received');
  });

  it('returns sent for STANDARD outgoing native transfer with non-zero value', () => {
    const tx = {
      amounts: {
        from: {
          amount: -500000000000000000n,
          token: {
            address: '0x0000000000000000000000000000000000000000',
            chainId: '0x1',
            decimals: 18,
            symbol: 'ETH',
          },
        },
      },
      transactionCategory: 'STANDARD',
      transactionProtocol: '',
      transactionType: 'STANDARD',
      txParams: {
        from: selectedAddress,
        to: '0x316bde155acd07609872a56bc32ccfb0b13201fa',
        value: '0x6f05b59d3b20000',
      },
    } as unknown as TransactionViewModel;

    const { result } = renderHook(() => useGetTitle(tx));

    expect(result.current).toBe('sentSpecifiedTokens:ETH');
  });

  it('returns contractInteraction for zero-value STANDARD tx with no transfers', () => {
    const tx = {
      amounts: {
        from: {
          amount: 0n,
          token: {
            address: '0x0000000000000000000000000000000000000000',
            chainId: '0x1',
            decimals: 18,
            symbol: 'ETH',
          },
        },
      },
      transactionCategory: 'STANDARD',
      transactionProtocol: '',
      transactionType: 'STANDARD',
      txParams: {
        data: '0x608060405234801561001057600080fd5b50',
        from: selectedAddress,
        to: null,
        value: '0x0',
      },
      valueTransfers: [],
    } as unknown as TransactionViewModel;

    const { result } = renderHook(() => useGetTitle(tx));

    expect(result.current).toBe('contractInteraction');
  });

  it('returns NFT approval title for ERC_721_APPROVE', () => {
    const tx = {
      transactionCategory: 'APPROVE',
      transactionProtocol: 'ERC_721',
      transactionType: 'ERC_721_APPROVE',
      txParams: {
        from: selectedAddress,
        to: '0x3bb093106b26ff4afcf608249f0ddc72a73dcc6a',
      },
    } as unknown as TransactionViewModel;

    const { result } = renderHook(() => useGetTitle(tx));

    expect(result.current).toBe('confirmTitleApproveTransactionNFT');
  });

  it('returns setApprovalForAll titles based on approve/revoke', () => {
    const approveAllTx = {
      transactionCategory: 'APPROVE',
      transactionProtocol: 'erc721',
      transactionType: 'GENERIC_CONTRACT_CALL',
      txParams: {
        data: '0xa22cb4650000000000000000000000002e0d7e8c45221fca00d74a3609a0f7097035d09b0000000000000000000000000000000000000000000000000000000000000001',
        from: selectedAddress,
      },
    } as unknown as TransactionViewModel;

    const revokeAllTx = {
      transactionCategory: 'APPROVE',
      transactionProtocol: 'erc1155',
      transactionType: 'GENERIC_CONTRACT_CALL',
      txParams: {
        data: '0xa22cb4650000000000000000000000002e0d7e8c45221fca00d74a3609a0f7097035d09b0000000000000000000000000000000000000000000000000000000000000000',
        from: selectedAddress,
      },
    } as unknown as TransactionViewModel;

    const { result: approveAllResult } = renderHook(() =>
      useGetTitle(approveAllTx),
    );
    expect(approveAllResult.current).toBe('setApprovalForAllRedesignedTitle');

    const { result: revokeAllResult } = renderHook(() =>
      useGetTitle(revokeAllTx),
    );
    expect(revokeAllResult.current).toBe('revokePermissionTitle:token');
  });

  it('returns revoke title for selector-only setApprovalForAll payload', () => {
    const tx = {
      methodId: '0xa22cb465',
      transactionCategory: 'APPROVE',
      transactionProtocol: 'ERC_721',
      transactionType: 'ERC_721_APPROVE',
    } as unknown as TransactionViewModel;

    const { result } = renderHook(() => useGetTitle(tx));

    expect(result.current).toBe('revokePermissionTitle:token');
  });

  it('returns bridgedToChain title for BRIDGE_OUT transaction with known chainId', () => {
    const tx = {
      chainId: '0xe708',
      from: '0x4f5243ceea96cee1da0fdb89c756d0e999439424',
      methodId: '0x3ce33bff',
      to: '0xe3d0d2607182af5b24f5c3c2e4990a053add64e3',
      toAddressName: 'METAMASK_BRIDGE_V2',
      transactionCategory: 'BRIDGE_OUT',
      transactionProtocol: 'METAMASK',
      transactionType: 'METAMASK_BRIDGE_V2_BRIDGE_OUT',
      value: '100000000000000',
    } as unknown as TransactionViewModel;

    const { result } = renderHook(() => useGetTitle(tx));

    expect(result.current).toBe('bridgedToChain:Linea');
  });
});
