import { renderHook } from '@testing-library/react-hooks';
import { CHAIN_IDS } from '../../shared/constants/network';
import { useEarliestNonceByChain } from './useEarliestNonceByChain';

function buildGroup(
  nonce: string | undefined,
  chainId: string,
  status: string = 'submitted',
) {
  return {
    nonce,
    primaryTransaction: { status },
    initialTransaction: { chainId },
  };
}

describe('useEarliestNonceByChain', () => {
  it('should calculate earliest nonce per chain', () => {
    const transactionGroups = [
      buildGroup('0x5', CHAIN_IDS.GOERLI),
      buildGroup('0xa', CHAIN_IDS.MAINNET),
      buildGroup('0x6', CHAIN_IDS.GOERLI),
    ];

    const { result } = renderHook(() =>
      useEarliestNonceByChain(transactionGroups),
    );

    expect(result.current).toEqual({
      [CHAIN_IDS.GOERLI]: 5,
      [CHAIN_IDS.MAINNET]: 10,
    });
  });

  it('should handle nonce 0 correctly', () => {
    const transactionGroups = [
      buildGroup('0x5', CHAIN_IDS.GOERLI),
      buildGroup('0x0', CHAIN_IDS.GOERLI),
    ];

    const { result } = renderHook(() =>
      useEarliestNonceByChain(transactionGroups),
    );

    expect(result.current).toEqual({
      [CHAIN_IDS.GOERLI]: 0,
    });
  });

  it('should handle undefined nonce', () => {
    const transactionGroups = [
      buildGroup(undefined, CHAIN_IDS.GOERLI),
      buildGroup('0x5', CHAIN_IDS.GOERLI),
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
      buildGroup('0xa', CHAIN_IDS.GOERLI),
      buildGroup('0x5', CHAIN_IDS.GOERLI),
    ];

    const { result } = renderHook(() =>
      useEarliestNonceByChain(transactionGroups),
    );

    expect(result.current).toEqual({
      [CHAIN_IDS.GOERLI]: 5,
    });
  });

  it('ignores confirmed groups and only considers pending nonces', () => {
    const transactionGroups = [
      buildGroup('0x18b', CHAIN_IDS.SEPOLIA, 'confirmed'),
      buildGroup('0x18c', CHAIN_IDS.SEPOLIA, 'confirmed'),
      buildGroup('0x18d', CHAIN_IDS.SEPOLIA, 'submitted'),
    ];

    const { result } = renderHook(() =>
      useEarliestNonceByChain(transactionGroups),
    );

    // 0x18b (395) and 0x18c (396) are confirmed so they must be ignored.
    // Only 0x18d (397) is pending and should be the earliest.
    expect(result.current).toEqual({
      [CHAIN_IDS.SEPOLIA]: 397,
    });
  });

  it('returns empty map when all groups are confirmed', () => {
    const transactionGroups = [
      buildGroup('0x5', CHAIN_IDS.GOERLI, 'confirmed'),
      buildGroup('0x6', CHAIN_IDS.GOERLI, 'confirmed'),
    ];

    const { result } = renderHook(() =>
      useEarliestNonceByChain(transactionGroups),
    );

    expect(result.current).toEqual({});
  });

  it('considers unapproved and approved as pending', () => {
    const transactionGroups = [
      buildGroup('0xa', CHAIN_IDS.MAINNET, 'unapproved'),
      buildGroup('0x5', CHAIN_IDS.MAINNET, 'approved'),
    ];

    const { result } = renderHook(() =>
      useEarliestNonceByChain(transactionGroups),
    );

    expect(result.current).toEqual({
      [CHAIN_IDS.MAINNET]: 5,
    });
  });
});
