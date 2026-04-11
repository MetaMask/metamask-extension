import { renderHook } from '@testing-library/react-hooks';
import { useSelector } from 'react-redux';
import { getPerpsStreamManager } from '../../providers/perps/PerpsStreamManager';
import { useEagerPerpsInit } from './useEagerPerpsInit';

jest.mock('react-redux', () => ({
  useSelector: jest.fn(),
}));

jest.mock('../../providers/perps/PerpsStreamManager', () => ({
  getPerpsStreamManager: jest.fn(),
}));

const mockUseSelector = useSelector as jest.MockedFunction<typeof useSelector>;
const mockGetPerpsStreamManager = getPerpsStreamManager as jest.MockedFunction<
  typeof getPerpsStreamManager
>;

/**
 * Set up useSelector mocks in call order:
 * 1. getIsUnlocked
 * 2. getIsPerpsExperienceAvailable
 * 3. getSelectedInternalAccount
 *
 * @param isUnlocked - Whether the wallet is unlocked.
 * @param isPerpsAvailable - Whether perps experience is available.
 * @param account - The selected internal account (or null).
 */
function mockSelectors(
  isUnlocked: boolean,
  isPerpsAvailable: boolean,
  account: { address: string } | null,
) {
  mockUseSelector
    .mockReturnValueOnce(isUnlocked)
    .mockReturnValueOnce(isPerpsAvailable)
    .mockReturnValueOnce(account);
}

describe('useEagerPerpsInit', () => {
  const mockInitForAddress = jest.fn().mockResolvedValue(undefined);
  const mockStreamManager = { initForAddress: mockInitForAddress } as never;

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetPerpsStreamManager.mockReturnValue(mockStreamManager);
  });

  it('calls initForAddress when unlocked, perps available, and address present', () => {
    mockSelectors(true, true, { address: '0xabc123' });

    renderHook(() => useEagerPerpsInit());

    expect(mockInitForAddress).toHaveBeenCalledWith('0xabc123');
  });

  it('does not call initForAddress when wallet is locked', () => {
    mockSelectors(false, true, { address: '0xabc123' });

    renderHook(() => useEagerPerpsInit());

    expect(mockInitForAddress).not.toHaveBeenCalled();
  });

  it('does not call initForAddress when perps is not available', () => {
    mockSelectors(true, false, { address: '0xabc123' });

    renderHook(() => useEagerPerpsInit());

    expect(mockInitForAddress).not.toHaveBeenCalled();
  });

  it('does not call initForAddress when no account is selected', () => {
    mockSelectors(true, true, null);

    renderHook(() => useEagerPerpsInit());

    expect(mockInitForAddress).not.toHaveBeenCalled();
  });

  it('handles initForAddress failure gracefully', () => {
    mockInitForAddress.mockRejectedValueOnce(new Error('init failed'));
    mockSelectors(true, true, { address: '0xabc123' });

    expect(() => renderHook(() => useEagerPerpsInit())).not.toThrow();
    expect(mockInitForAddress).toHaveBeenCalledWith('0xabc123');
  });
});
