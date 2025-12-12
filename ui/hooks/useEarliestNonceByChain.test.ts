import { renderHook } from '@testing-library/react-hooks';
import { CHAIN_IDS } from '../../shared/constants/network';
import { useEarliestNonceByChain } from './useEarliestNonceByChain';

describe('useEarliestNonceByChain', () => {
  it('should calculate earliest nonce per chain', () => {
    const transactionGroups = [
      {
        initialTransaction: {
          nonce: '0x5', // 5
          chainId: CHAIN_IDS.GOERLI,
          status: 'submitted',
        },
      },
      {
        initialTransaction: {
          nonce: '0xa', // 10
          chainId: CHAIN_IDS.MAINNET,
          status: 'submitted',
        },
      },
      {
        initialTransaction: {
          nonce: '0x6', // 6
          chainId: CHAIN_IDS.GOERLI,
          status: 'submitted',
        },
      },
    ];

    const { result } = renderHook(() =>
      useEarliestNonceByChain(transactionGroups),
    );

    expect(result.current).toEqual({
      [CHAIN_IDS.GOERLI]: 5, // Lowest nonce for Goerli
      [CHAIN_IDS.MAINNET]: 10, // Only nonce for Mainnet
    });
  });

  it('should handle undefined nonce', () => {
    const transactionGroups = [
      {
        initialTransaction: {
          nonce: undefined,
          chainId: CHAIN_IDS.GOERLI,
          status: 'submitted',
        },
      },
      {
        initialTransaction: {
          nonce: '0x5',
          chainId: CHAIN_IDS.GOERLI,
          status: 'submitted',
        },
      },
    ];

    const { result } = renderHook(() =>
      useEarliestNonceByChain(transactionGroups),
    );

    expect(result.current).toEqual({
      [CHAIN_IDS.GOERLI]: 5,
    });
  });

  it('should work with only pending transactions', () => {
    const transactionGroups = [
      {
        initialTransaction: {
          nonce: '0xa', // 10
          chainId: CHAIN_IDS.GOERLI,
          status: 'submitted',
        },
      },
      {
        initialTransaction: {
          nonce: '0x5', // 5 - EARLIEST
          chainId: CHAIN_IDS.GOERLI,
          status: 'submitted',
        },
      },
    ];

    const { result } = renderHook(() =>
      useEarliestNonceByChain(transactionGroups),
    );

    expect(result.current).toEqual({
      [CHAIN_IDS.GOERLI]: 5,
    });
  });
});

