import { renderHook, act } from '@testing-library/react';
import { usePerpsEligibility } from './usePerpsEligibility';

const mockUnsubscribe = jest.fn();

function createMockController(initialEligible: boolean) {
  let stateChangeListener: ((state: { isEligible: boolean }) => void) | null =
    null;
  const state = { isEligible: initialEligible };
  return {
    state,
    messenger: {
      subscribe: (
        _event: string,
        handler: (state: { isEligible: boolean }) => void,
      ) => {
        stateChangeListener = handler;
        return mockUnsubscribe;
      },
    },
    setEligible(value: boolean) {
      state.isEligible = value;
      stateChangeListener?.(state);
    },
  };
}

jest.mock('../../providers/perps/PerpsControllerProvider', () => ({
  usePerpsController: jest.fn(),
}));

const mockUsePerpsController = jest.requireMock(
  '../../providers/perps/PerpsControllerProvider',
).usePerpsController as jest.Mock;

describe('usePerpsEligibility', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns isEligible from controller state', () => {
    const mockController = createMockController(true);
    mockUsePerpsController.mockReturnValue(mockController);

    const { result } = renderHook(() => usePerpsEligibility());

    expect(result.current.isEligible).toBe(true);
    expect(result.current.isLoading).toBe(false);
  });

  it('returns isEligible false when controller state is false', () => {
    const mockController = createMockController(false);
    mockUsePerpsController.mockReturnValue(mockController);

    const { result } = renderHook(() => usePerpsEligibility());

    expect(result.current.isEligible).toBe(false);
    expect(result.current.isLoading).toBe(false);
  });

  it('updates isEligible when controller state changes', () => {
    const mockController = createMockController(true);
    mockUsePerpsController.mockReturnValue(mockController);

    const { result } = renderHook(() => usePerpsEligibility());

    expect(result.current.isEligible).toBe(true);

    act(() => {
      mockController.setEligible(false);
    });

    expect(result.current.isEligible).toBe(false);

    act(() => {
      mockController.setEligible(true);
    });

    expect(result.current.isEligible).toBe(true);
  });

  it('unsubscribes from controller on unmount', () => {
    const mockController = createMockController(true);
    mockUsePerpsController.mockReturnValue(mockController);

    const { unmount } = renderHook(() => usePerpsEligibility());

    unmount();

    expect(mockUnsubscribe).toHaveBeenCalledTimes(1);
  });
});
