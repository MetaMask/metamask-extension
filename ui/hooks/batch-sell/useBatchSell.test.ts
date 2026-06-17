import { renderHook, act } from '@testing-library/react-hooks';
import { useBatchSell } from './useBatchSell';
import * as useBatchSellNavigationModule from './useBatchSellNavigation';

const mockNavigateToBatchSellSelectPage = jest.fn();

jest.mock('./useBatchSellNavigation', () => ({
  useBatchSellNavigation: jest.fn(),
}));

describe('useBatchSell', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest
      .mocked(useBatchSellNavigationModule.useBatchSellNavigation)
      .mockReturnValue({
        navigateToBatchSellSelectPage: mockNavigateToBatchSellSelectPage,
        navigateToBatchSellConfirmPage: jest.fn(),
        navigateToDefaultRoute: jest.fn(),
        resetLocationState: jest.fn(),
      });
  });

  it('returns openBatchSellExperience', () => {
    const { result } = renderHook(() => useBatchSell());

    expect(result.current.openBatchSellExperience).toBeDefined();
    expect(typeof result.current.openBatchSellExperience).toBe('function');
  });

  it('calls navigateToBatchSellSelectPage when openBatchSellExperience is invoked', () => {
    const { result } = renderHook(() => useBatchSell());

    act(() => {
      result.current.openBatchSellExperience();
    });

    expect(mockNavigateToBatchSellSelectPage).toHaveBeenCalledTimes(1);
  });

  it('openBatchSellExperience is stable across re-renders when the navigation fn does not change', () => {
    const { result, rerender } = renderHook(() => useBatchSell());

    const first = result.current.openBatchSellExperience;
    rerender();
    const second = result.current.openBatchSellExperience;

    expect(first).toBe(second);
  });

  it('openBatchSellExperience updates when navigateToBatchSellSelectPage reference changes', () => {
    const { result, rerender } = renderHook(() => useBatchSell());

    const first = result.current.openBatchSellExperience;

    // Simulate the navigation dependency changing
    const newNavigate = jest.fn();
    jest
      .mocked(useBatchSellNavigationModule.useBatchSellNavigation)
      .mockReturnValue({
        navigateToBatchSellSelectPage: newNavigate,
        navigateToBatchSellConfirmPage: jest.fn(),
        navigateToDefaultRoute: jest.fn(),
        resetLocationState: jest.fn(),
      });

    rerender();

    expect(result.current.openBatchSellExperience).not.toBe(first);
  });
});
