import mockState from '../../../../../test/data/mock-state.json';
import { renderHookWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import { usePerpsDepositTrigger } from './usePerpsDepositTrigger';
import { usePerpsDepositFlow } from './usePerpsDepositFlow';

jest.mock('./usePerpsDepositFlow', () => ({
  usePerpsDepositFlow: jest.fn(),
}));

const mockUsePerpsDepositFlow = usePerpsDepositFlow as jest.MockedFunction<
  typeof usePerpsDepositFlow
>;

describe('usePerpsDepositTrigger', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('delegates to usePerpsDepositFlow with navigateOnCreate enabled', () => {
    const flowReturn = {
      trigger: jest.fn(),
      isLoading: true,
    };
    mockUsePerpsDepositFlow.mockReturnValue(flowReturn);

    const onCreated = jest.fn();

    const { result } = renderHookWithProvider(
      () => usePerpsDepositTrigger({ returnTo: '/perps/home', onCreated }),
      mockState,
    );

    expect(mockUsePerpsDepositFlow).toHaveBeenCalledWith({
      returnTo: '/perps/home',
      onCreated,
      navigateOnCreate: true,
    });
    expect(result.current).toBe(flowReturn);
  });

  it('delegates with default options when none are provided', () => {
    const flowReturn = {
      trigger: jest.fn(),
      isLoading: false,
    };
    mockUsePerpsDepositFlow.mockReturnValue(flowReturn);

    const { result } = renderHookWithProvider(
      () => usePerpsDepositTrigger(),
      mockState,
    );

    expect(mockUsePerpsDepositFlow).toHaveBeenCalledWith({
      navigateOnCreate: true,
    });
    expect(result.current).toBe(flowReturn);
  });
});
