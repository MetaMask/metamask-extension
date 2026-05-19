import { waitFor } from '@testing-library/react';
import { renderHookWithProvider } from '../../../test/lib/render-helpers-navigate';
import { setBackgroundConnection } from '../../store/background-connection';
import { useVipTier } from './useVipTier';

jest.mock('../../store/actions', () => ({
  ...jest.requireActual('../../store/actions'),
  forceUpdateMetamaskState: () => Promise.resolve(),
}));

const mockGetVipTierForAccount = jest.fn();
setBackgroundConnection({
  rewardsGetVipTierForAccount: async (...args: unknown[]) =>
    mockGetVipTierForAccount(...args),
} as never);

const MOCK_ACCOUNT_ID =
  'eip155:1:0xabc' as `${string}:${string}:${string}`;

const mockState = {
  metamask: {},
};

describe('useVipTier', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns null initially', () => {
    mockGetVipTierForAccount.mockReturnValue(new Promise(() => undefined));

    const { result } = renderHookWithProvider(
      () => useVipTier(MOCK_ACCOUNT_ID),
      mockState,
    );

    expect(result.current).toBeNull();
  });

  it('returns the VIP tier on success', async () => {
    mockGetVipTierForAccount.mockResolvedValue(3);

    const { result } = renderHookWithProvider(
      () => useVipTier(MOCK_ACCOUNT_ID),
      mockState,
    );

    await waitFor(() => {
      expect(result.current).toBe(3);
    });

    expect(mockGetVipTierForAccount).toHaveBeenCalledWith(MOCK_ACCOUNT_ID);
  });

  it('returns null when the background returns null', async () => {
    mockGetVipTierForAccount.mockResolvedValue(null);

    const { result } = renderHookWithProvider(
      () => useVipTier(MOCK_ACCOUNT_ID),
      mockState,
    );

    await waitFor(() => {
      expect(mockGetVipTierForAccount).toHaveBeenCalledTimes(1);
    });

    expect(result.current).toBeNull();
  });

  it('returns null on error', async () => {
    jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    mockGetVipTierForAccount.mockRejectedValue(new Error('fail'));

    const { result } = renderHookWithProvider(
      () => useVipTier(MOCK_ACCOUNT_ID),
      mockState,
    );

    await waitFor(() => {
      expect(mockGetVipTierForAccount).toHaveBeenCalledTimes(1);
    });

    expect(result.current).toBeNull();
    expect(console.warn).toHaveBeenCalledWith(
      'Error fetching vip tier:',
      expect.any(Error),
    );

    (console.warn as jest.Mock).mockRestore();
  });
});
