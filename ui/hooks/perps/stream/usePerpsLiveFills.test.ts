import { renderHook } from '@testing-library/react-hooks';
import type { OrderFill } from '@metamask/perps-controller';
import { usePerpsChannel } from './usePerpsChannel';
import { usePerpsLiveFills } from './usePerpsLiveFills';

jest.mock('./usePerpsChannel', () => ({
  usePerpsChannel: jest.fn(),
}));

const mockUsePerpsChannel = usePerpsChannel as jest.MockedFunction<
  typeof usePerpsChannel
>;

describe('usePerpsLiveFills', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns channel fills and loading state with default options', () => {
    const fills = [{ orderId: '1', symbol: 'BTC' }] as OrderFill[];
    mockUsePerpsChannel.mockReturnValue({
      data: fills,
      isInitialLoading: false,
    });

    const { result } = renderHook(() => usePerpsLiveFills());

    expect(mockUsePerpsChannel).toHaveBeenCalledWith(expect.any(Function), []);
    expect(result.current).toEqual({
      fills,
      isInitialLoading: false,
    });
  });

  it('returns channel fills and loading state with explicit options', () => {
    const fills = [{ orderId: '2', symbol: 'ETH' }] as OrderFill[];
    mockUsePerpsChannel.mockReturnValue({
      data: fills,
      isInitialLoading: true,
    });

    const { result } = renderHook(() => usePerpsLiveFills({ throttleMs: 100 }));

    expect(mockUsePerpsChannel).toHaveBeenCalledWith(expect.any(Function), []);
    expect(result.current).toEqual({
      fills,
      isInitialLoading: true,
    });
  });
});
