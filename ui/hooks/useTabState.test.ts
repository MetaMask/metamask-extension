import { renderHook, act } from '@testing-library/react-hooks';
import { useTabState } from './useTabState';

const mockSetSearchParams = jest.fn();

jest.mock('react-router-dom', () => ({
  useSearchParams: () => [
    new URLSearchParams('tab=tokens'),
    mockSetSearchParams,
  ],
}));

describe('useTabState', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('clears navigation state when changing tabs', () => {
    const { result } = renderHook(() => useTabState());

    act(() => {
      result.current[1]('defi');
    });

    expect(mockSetSearchParams).toHaveBeenCalledWith(expect.any(Function), {
      state: null,
    });
  });
});
