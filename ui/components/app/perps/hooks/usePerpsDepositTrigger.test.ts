import mockState from '../../../../../test/data/mock-state.json';
import { renderHookWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import { usePerpsDepositTrigger } from './usePerpsDepositTrigger';
import { usePerpsDepositConfirmation } from './usePerpsDepositConfirmation';

jest.mock('./usePerpsDepositConfirmation', () => ({
  usePerpsDepositConfirmation: jest.fn(),
}));

const mockUsePerpsDepositConfirmation =
  usePerpsDepositConfirmation as jest.MockedFunction<
    typeof usePerpsDepositConfirmation
  >;

describe('usePerpsDepositTrigger', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('delegates to usePerpsDepositConfirmation with navigateOnCreate enabled', () => {
    const flowReturn = {
      trigger: jest.fn(),
      isLoading: true,
    };
    mockUsePerpsDepositConfirmation.mockReturnValue(flowReturn);

    const onCreated = jest.fn();

    const { result } = renderHookWithProvider(
      () => usePerpsDepositTrigger({ returnTo: '/perps/home', onCreated }),
      mockState,
    );

    expect(mockUsePerpsDepositConfirmation).toHaveBeenCalledWith({
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
    mockUsePerpsDepositConfirmation.mockReturnValue(flowReturn);

    const { result } = renderHookWithProvider(
      () => usePerpsDepositTrigger(),
      mockState,
    );

    expect(mockUsePerpsDepositConfirmation).toHaveBeenCalledWith({
      navigateOnCreate: true,
    });
    expect(result.current).toBe(flowReturn);
  });
});
