import { act } from '@testing-library/react';
import { useRewardsWithQuote } from '../../../../../hooks/bridge/useRewards';

import { getMockConfirmStateForTransaction } from '../../../../../../test/data/confirmations/helper';
import { mockSwapConfirmation } from '../../../../../../test/data/confirmations/contract-interaction';
import { renderHookWithConfirmContextProvider } from '../../../../../../test/lib/confirmations/render-helpers';
import { Confirmation } from '../../../types/confirm';
import { useDappSwapComparisonRewardText } from './useDappSwapComparisonRewardText';
import * as DappSwapContext from '../../../context/dapp-swap';

jest.mock('../../../../../hooks/bridge/useRewards');

async function runHook() {
  const response = renderHookWithConfirmContextProvider(
    useDappSwapComparisonRewardText,
    getMockConfirmStateForTransaction(mockSwapConfirmation as Confirmation),
  );

  await act(async () => {
    // Ignore
  });

  return response.result.current;
}

describe('useDappSwapComparisonRewardText', () => {
  const mockUseRewardsWithQuote = useRewardsWithQuote as jest.Mock;

  const mockSelectedQuote = {
    quote: { id: 'quote-1' },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(DappSwapContext, 'useDappSwapContext').mockReturnValue({
      selectedQuote: mockSelectedQuote,
      setSelectedQuote: jest.fn(),
      setQuotedSwapDisplayedInInfo: jest.fn(),
    } as unknown as ReturnType<typeof DappSwapContext.useDappSwapContext>);
  });

  it('returns null when shouldShowRewardsRow is false', async () => {
    mockUseRewardsWithQuote.mockReturnValue({
      shouldShowRewardsRow: false,
      isLoading: false,
      estimatedPoints: 1500,
      hasError: false,
    });

    const result = await runHook();

    expect(result).toBeNull();
  });

  it('returns null when hasError is true', async () => {
    mockUseRewardsWithQuote.mockReturnValue({
      shouldShowRewardsRow: true,
      isLoading: false,
      estimatedPoints: 1500,
      hasError: true,
    });

    const result = await runHook();

    expect(result).toBeNull();
  });

  it('returns null when isLoading is true', async () => {
    mockUseRewardsWithQuote.mockReturnValue({
      shouldShowRewardsRow: true,
      isLoading: true,
      estimatedPoints: 1500,
      hasError: false,
    });

    const result = await runHook();

    expect(result).toBeNull();
  });

  it('returns formatted reward text when estimatedPoints is provided', async () => {
    mockUseRewardsWithQuote.mockReturnValue({
      shouldShowRewardsRow: true,
      isLoading: false,
      estimatedPoints: 1500,
      hasError: false,
    });

    const result = await runHook();

    expect(result).toEqual({
      text: 'Earn 1500 points',
      estimatedPoints: 1500,
    });
  });

  it('returns null when no estimatedPoints', async () => {
    mockUseRewardsWithQuote.mockReturnValue({
      shouldShowRewardsRow: true,
      isLoading: false,
      estimatedPoints: null,
      hasError: false,
    });

    const result = await runHook();

    expect(result).toBeNull();
  });

  it('calls useRewardsWithQuote with correct parameters', async () => {
    mockUseRewardsWithQuote.mockReturnValue({
      shouldShowRewardsRow: true,
      isLoading: false,
      estimatedPoints: 2000,
      hasError: false,
    });

    await runHook();

    expect(mockUseRewardsWithQuote).toHaveBeenCalledWith({
      quote: mockSelectedQuote.quote,
      fromAddress: '0x5206d14bfa10bd18989038fe628a79a135f2ee2f',
      chainId: '0x2105',
    });
  });
});
