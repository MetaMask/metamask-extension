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

  it('returns sent NFT title for ERC_721_TRANSFER with empty valueTransfers', () => {
    const tx = {
      from: '0x4f5243ceea96cee1da0fdb89c756d0e999439424',
      methodId: '0x23b872dd',
      to: '0x889edc2edab5f40e902b864ad4d7ade8e412f9b1',
      transactionCategory: 'TRANSFER',
      transactionProtocol: 'ERC_721',
      transactionType: 'ERC_721_TRANSFER',
      value: '0',
      valueTransfers: [],
    } as unknown as TransactionViewModel;

    const { result } = renderHook(() => useGetTitle(tx));

    expect(result.current).toBe('sentSpecifiedTokens:NFT');
  });

  it('returns bought title for CONTRACT_CALL with incoming NFT', () => {
    const tx = {
      from: '0x4f5243ceea96cee1da0fdb89c756d0e999439424',
      methodId: '0x00000000',
      to: '0x0000000000000068f116a894984e2db1123eb395',
      transactionCategory: 'CONTRACT_CALL',
      transactionType: 'GENERIC_CONTRACT_CALL',
      value: '1000000000000000',
      valueTransfers: [
        {
          amount: '1000000000000000',
          decimal: 18,
          from: '0x4f5243ceea96cee1da0fdb89c756d0e999439424',
          to: '0x0000000000000068f116a894984e2db1123eb395',
          transferType: 'normal',
        },
        {
          amount: 1,
          contractAddress: '0x3edf71a31b80ff6a45fdb0858ec54de98df047aa',
          from: '0x78c87da124bb36a914ff1c0f2d642f47870c997c',
          to: '0x4f5243ceea96cee1da0fdb89c756d0e999439424',
          tokenId: '984',
          transferType: 'erc1155',
        },
      ],
    } as unknown as TransactionViewModel;

    const { result } = renderHook(() => useGetTitle(tx));

    expect(result.current).toBe('nftBought:NFT');
  });

  it('returns bought title for TRANSFER with incoming NFT (OpenSea purchase)', () => {
    const tx = {
      chainId: '0x1',
      from: '0x4f5243ceea96cee1da0fdb89c756d0e999439424',
      methodId: '0x00000000',
      to: '0x7be8076f4ea4a4ad08075c2508e481d6c946d12b',
      toAddressName: 'OPENSEA_V1.6',
      transactionCategory: 'TRANSFER',
      transactionType: 'GENERIC_CONTRACT_CALL',
      value: '116000000000000000',
      valueTransfers: [
        {
          amount: '116000000000000000',
          decimal: 18,
          from: '0x4f5243ceea96cee1da0fdb89c756d0e999439424',
          to: '0x7be8076f4ea4a4ad08075c2508e481d6c946d12b',
          transferType: 'normal',
        },
        {
          amount: 1,
          contractAddress: '0x06012c8cf97bead5deae237070f9587f8e7a266d',
          from: '0xf7e0d1fc68e3fb6cc6ad8aa0f7c48fadd9419a10',
          to: '0x4f5243ceea96cee1da0fdb89c756d0e999439424',
          tokenId: '1432508',
          transferType: 'erc721',
        },
      ],
    } as unknown as TransactionViewModel;

    const { result } = renderHook(() => useGetTitle(tx));

    expect(result.current).toBe('nftBought:NFT');
  });

  it('returns minted title for CONTRACT_CALL with NFT from zero address', () => {
    const tx = {
      from: '0x4f5243ceea96cee1da0fdb89c756d0e999439424',
      methodId: '0x1f7fdffa',
      to: '0x61de1b47cca2e4383803a48b5cafa78a25c4d69f',
      transactionCategory: 'CONTRACT_CALL',
      transactionType: 'GENERIC_CONTRACT_CALL',
      value: '0',
      valueTransfers: [
        {
          amount: null,
          contractAddress: '0x61de1b47cca2e4383803a48b5cafa78a25c4d69f',
          from: '0x0000000000000000000000000000000000000000',
          to: '0x4f5243ceea96cee1da0fdb89c756d0e999439424',
          tokenId: '0',
          transferType: 'erc1155',
        },
      ],
    } as unknown as TransactionViewModel;

    const { result } = renderHook(() => useGetTitle(tx));

    expect(result.current).toBe('nftMinted:NFT');
  });

  it('returns received for incoming NFT with no payment (gift)', () => {
    const tx = {
      from: '0xabcdef1234567890abcdef1234567890abcdef12',
      to: '0x4f5243ceea96cee1da0fdb89c756d0e999439424',
      transactionCategory: 'TRANSFER',
      transactionType: 'ERC_721_TRANSFER',
      value: '0',
      valueTransfers: [
        {
          amount: 1,
          contractAddress: '0x06012c8cf97bead5deae237070f9587f8e7a266d',
          from: '0xabcdef1234567890abcdef1234567890abcdef12',
          to: '0x4f5243ceea96cee1da0fdb89c756d0e999439424',
          tokenId: '12345',
          transferType: 'erc721',
        },
      ],
    } as unknown as TransactionViewModel;

    const { result } = renderHook(() => useGetTitle(tx));

    expect(result.current).toBe('received');
  });

  it('returns received for CONTRACT_CALL with incoming NFT and no payment', () => {
    const tx = {
      from: '0x9bed78535d6a03a955f1504aadba974d9a29e292',
      methodId: '0xf242432a',
      to: '0x3edf71a31b80ff6a45fdb0858ec54de98df047aa',
      transactionCategory: 'CONTRACT_CALL',
      transactionType: 'GENERIC_CONTRACT_CALL',
      value: '0',
      valueTransfers: [
        {
          amount: 1,
          contractAddress: '0x3edf71a31b80ff6a45fdb0858ec54de98df047aa',
          from: '0x9bed78535d6a03a955f1504aadba974d9a29e292',
          to: '0x4f5243ceea96cee1da0fdb89c756d0e999439424',
          tokenId: '984',
          transferType: 'erc1155',
        },
      ],
    } as unknown as TransactionViewModel;

    const { result } = renderHook(() => useGetTitle(tx));

    expect(result.current).toBe('received');
  });

  it('returns sent NFT for CONTRACT_CALL with outgoing NFT (sender view)', () => {
    // Different store where selected account is the sender
    const senderAddress = '0x9bed78535d6a03a955f1504aadba974d9a29e292';
    const senderStore = configureMockStore()({
      metamask: {
        internalAccounts: {
          selectedAccount: '1',
          accounts: {
            '1': {
              address: senderAddress,
              type: 'eip155:eoa',
            },
          },
        },
      },
    });

    const tx = {
      from: senderAddress,
      methodId: '0xf242432a',
      to: '0x3edf71a31b80ff6a45fdb0858ec54de98df047aa',
      transactionCategory: 'CONTRACT_CALL',
      transactionType: 'GENERIC_CONTRACT_CALL',
      value: '0',
      valueTransfers: [
        {
          amount: 1,
          contractAddress: '0x3edf71a31b80ff6a45fdb0858ec54de98df047aa',
          from: senderAddress,
          to: '0x4f5243ceea96cee1da0fdb89c756d0e999439424',
          tokenId: '984',
          transferType: 'erc1155',
        },
      ],
    } as unknown as TransactionViewModel;

    const { result } = renderHookBase(() => useGetTitle(tx), {
      wrapper: ({ children }) => (
        <Provider store={senderStore}>{children}</Provider>
      ),
    });

    expect(result.current).toBe('sentSpecifiedTokens:NFT');
  });
});
