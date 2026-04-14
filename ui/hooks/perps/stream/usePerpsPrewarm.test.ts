import { renderHook } from '@testing-library/react-hooks';
import { usePerpsPrewarm } from './usePerpsPrewarm';
import { usePerpsStreamManager } from './usePerpsStreamManager';

jest.mock('./usePerpsStreamManager');

const usePerpsStreamManagerMock = usePerpsStreamManager as jest.MockedFunction<
  typeof usePerpsStreamManager
>;

describe('usePerpsPrewarm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('does nothing when stream manager is not ready', () => {
    usePerpsStreamManagerMock.mockReturnValue({
      streamManager: null,
      isInitializing: true,
      error: null,
      selectedAddress: '0x123',
    });

    renderHook(() => usePerpsPrewarm());
    // No errors thrown
  });

  it('calls prewarm when stream manager becomes available', () => {
    const prewarm = jest.fn();
    const cleanupPrewarm = jest.fn();

    const mockStreamManager = {
      prewarm,
      cleanupPrewarm,
    } as never;

    usePerpsStreamManagerMock.mockReturnValue({
      streamManager: mockStreamManager,
      isInitializing: false,
      error: null,
      selectedAddress: '0x123',
    });

    renderHook(() => usePerpsPrewarm());

    expect(prewarm).toHaveBeenCalledTimes(1);
    expect(cleanupPrewarm).not.toHaveBeenCalled();
  });

  it('calls cleanupPrewarm on unmount', () => {
    const prewarm = jest.fn();
    const cleanupPrewarm = jest.fn();

    const mockStreamManager = {
      prewarm,
      cleanupPrewarm,
    } as never;

    usePerpsStreamManagerMock.mockReturnValue({
      streamManager: mockStreamManager,
      isInitializing: false,
      error: null,
      selectedAddress: '0x123',
    });

    const { unmount } = renderHook(() => usePerpsPrewarm());

    expect(prewarm).toHaveBeenCalledTimes(1);

    unmount();

    expect(cleanupPrewarm).toHaveBeenCalledTimes(1);
  });

  it('re-prewarms when stream manager changes', () => {
    const prewarm1 = jest.fn();
    const cleanupPrewarm1 = jest.fn();
    const prewarm2 = jest.fn();
    const cleanupPrewarm2 = jest.fn();

    const sm1 = { prewarm: prewarm1, cleanupPrewarm: cleanupPrewarm1 } as never;
    const sm2 = { prewarm: prewarm2, cleanupPrewarm: cleanupPrewarm2 } as never;

    usePerpsStreamManagerMock.mockReturnValue({
      streamManager: sm1,
      isInitializing: false,
      error: null,
      selectedAddress: '0x123',
    });

    const { rerender } = renderHook(() => usePerpsPrewarm());

    expect(prewarm1).toHaveBeenCalledTimes(1);

    usePerpsStreamManagerMock.mockReturnValue({
      streamManager: sm2,
      isInitializing: false,
      error: null,
      selectedAddress: '0x456',
    });

    rerender();

    expect(cleanupPrewarm1).toHaveBeenCalledTimes(1);
    expect(prewarm2).toHaveBeenCalledTimes(1);
  });
});
