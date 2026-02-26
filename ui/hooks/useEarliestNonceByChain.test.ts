import { renderHook } from '@testing-library/react-hooks';
import { CHAIN_IDS } from '../../shared/constants/network';
import { useEarliestNonceByChain } from './useEarliestNonceByChain';

describe('useEarliestNonceByChain', () => {
  it('should calculate earliest nonce per chain', () => {
    const transactionGroups = [
      {
        nonce: '0x5', // 5
        initialTransaction: {
          chainId: CHAIN_IDS.GOERLI,
          status: 'submitted',
        },
      },
      {
        nonce: '0xa', // 10
        initialTransaction: {
          chainId: CHAIN_IDS.MAINNET,
          status: 'submitted',
        },
      },
      {
        nonce: '0x6', // 6
        initialTransaction: {
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

  it('should handle nonce 0 correctly', () => {
    const transactionGroups = [
      {
        nonce: '0x5', // 5
        initialTransaction: {
          chainId: CHAIN_IDS.GOERLI,
          status: 'submitted',
        },
      },
      {
        nonce: '0x0', // 0 - EARLIEST (first tx from new account)
        initialTransaction: {
          chainId: CHAIN_IDS.GOERLI,
          status: 'submitted',
        },
      },
    ];

    const { result } = renderHook(() =>
      useEarliestNonceByChain(transactionGroups),
    );

    // Should correctly identify 0 as earliest, not be overwritten by 5
    expect(result.current).toEqual({
      [CHAIN_IDS.GOERLI]: 0,
    });
  });

  it('should handle undefined nonce', () => {
    const transactionGroups = [
      {
        nonce: undefined,
        initialTransaction: {
          chainId: CHAIN_IDS.GOERLI,
          status: 'submitted',
        },
      },
      {
        nonce: '0x5',
        initialTransaction: {
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
        nonce: '0xa', // 10
        initialTransaction: {
          chainId: CHAIN_IDS.GOERLI,
          status: 'submitted',
        },
      },
      {
        nonce: '0x5', // 5 - EARLIEST
        initialTransaction: {
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
