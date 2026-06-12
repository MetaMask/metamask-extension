import { renderHook } from '@testing-library/react-hooks';
import * as reactRedux from 'react-redux';
import { CHAIN_IDS } from '@metamask/transaction-controller';
import { Hex, CaipChainId } from '@metamask/utils';
import { useRefreshSmartTransactionsLiveness } from './useRefreshSmartTransactionsLiveness';

const mockInnerFn = jest.fn().mockResolvedValue(undefined);

jest.mock('react-redux', () => ({
  useSelector: jest.fn(),
}));

jest.mock('../../../store/actions', () => ({
  fetchSmartTransactionsLiveness: jest.fn(() => mockInnerFn),
}));

jest.mock('../../../ducks/bridge/utils', () => ({
  isNonEvmChain: (chainId: string) => chainId.startsWith('solana:'),
}));

const mockFetchSmartTransactionsLiveness = jest.requireMock(
  '../../../store/actions',
).fetchSmartTransactionsLiveness;

describe('useRefreshSmartTransactionsLiveness', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (reactRedux.useSelector as jest.Mock).mockReturnValue(true); // opted in by default
  });

  it('does not fetch when chainId is null', () => {
    renderHook(() => useRefreshSmartTransactionsLiveness(null));
    expect(mockFetchSmartTransactionsLiveness).not.toHaveBeenCalled();
  });

  it('does not fetch when chainId is undefined', () => {
    renderHook(() => useRefreshSmartTransactionsLiveness(undefined));
    expect(mockFetchSmartTransactionsLiveness).not.toHaveBeenCalled();
  });

  it('does not fetch for non-EVM chains', () => {
    renderHook(() => useRefreshSmartTransactionsLiveness('solana:mainnet'));
    expect(mockFetchSmartTransactionsLiveness).not.toHaveBeenCalled();
  });

  it('does not fetch for unsupported EVM chains', () => {
    renderHook(() => useRefreshSmartTransactionsLiveness('0x999'));
    expect(mockFetchSmartTransactionsLiveness).not.toHaveBeenCalled();
  });

  it('does not fetch when user has not opted in', () => {
    (reactRedux.useSelector as jest.Mock).mockReturnValue(false);
    renderHook(() => useRefreshSmartTransactionsLiveness(CHAIN_IDS.MAINNET));
    expect(mockFetchSmartTransactionsLiveness).not.toHaveBeenCalled();
  });

  it('fetches smart transactions liveness for mainnet', () => {
    renderHook(() => useRefreshSmartTransactionsLiveness(CHAIN_IDS.MAINNET));
    expect(mockFetchSmartTransactionsLiveness).toHaveBeenCalledTimes(1);
    expect(mockFetchSmartTransactionsLiveness).toHaveBeenCalledWith({
      chainId: CHAIN_IDS.MAINNET,
    });
    expect(mockInnerFn).toHaveBeenCalledTimes(1);
  });
  it('fetches smart transactions liveness for CAIP chain ID', () => {
    renderHook(() => useRefreshSmartTransactionsLiveness('eip155:1'));
    expect(mockFetchSmartTransactionsLiveness).toHaveBeenCalledTimes(1);
    expect(mockFetchSmartTransactionsLiveness).toHaveBeenCalledWith({
      chainId: '0x1',
    });
    expect(mockInnerFn).toHaveBeenCalledTimes(1);
  });

  it('re-fetches when chainId changes to another supported chain', () => {
    const { rerender } = renderHook<
      { chainId: Hex | CaipChainId | null | undefined },
      void
    >(({ chainId }) => useRefreshSmartTransactionsLiveness(chainId), {
      initialProps: { chainId: CHAIN_IDS.MAINNET as Hex },
    });

    expect(mockFetchSmartTransactionsLiveness).toHaveBeenCalledTimes(1);
    expect(mockInnerFn).toHaveBeenCalledTimes(1);

    // BSC is in both production and development allowed lists
    rerender({ chainId: CHAIN_IDS.BSC as Hex });
    expect(mockFetchSmartTransactionsLiveness).toHaveBeenCalledTimes(2);
    expect(mockInnerFn).toHaveBeenCalledTimes(2);
  });
});
