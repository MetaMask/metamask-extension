import React from 'react';
import { render, screen } from '@testing-library/react';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { useDappSwapComparisonRewardText } from '../../hooks/transactions/dapp-swap-comparison/useDappSwapComparisonRewardText';
import { useDappSwapContext } from '../../context/dapp-swap';
import { EstimatedPointsSection } from './estimated-points';

jest.mock('../../../../hooks/useI18nContext', () => ({
  useI18nContext: jest.fn(),
}));

jest.mock(
  '../../hooks/transactions/dapp-swap-comparison/useDappSwapComparisonRewardText',
  () => ({
    useDappSwapComparisonRewardText: jest.fn(),
  }),
);

jest.mock('../../context/dapp-swap', () => ({
  useDappSwapContext: jest.fn(),
}));

jest.mock('../../../../components/app/confirm/info/row', () => ({
  ConfirmInfoRow: ({
    children,
    label,
  }: {
    children: React.ReactNode;
    label: string;
  }) => (
    <div data-testid="confirm-info-row" data-label={label}>
      {children}
    </div>
  ),
}));

jest.mock('../../../../components/app/confirm/info/row/section', () => ({
  ConfirmInfoSection: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="confirm-info-section">{children}</div>
  ),
}));

jest.mock('../../../../components/app/rewards/RewardsBadge', () => ({
  RewardsBadge: ({ formattedPoints }: { formattedPoints: string }) => (
    <div data-testid="rewards-badge">{formattedPoints}</div>
  ),
}));

const mockUseI18nContext = jest.mocked(useI18nContext);
const mockUseDappSwapComparisonRewardText = jest.mocked(
  useDappSwapComparisonRewardText,
);
const mockUseDappSwapContext = jest.mocked(useDappSwapContext);

describe('EstimatedPointsSection', () => {
  const mockT = jest.fn((key) => key);

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseI18nContext.mockReturnValue(mockT);
  });

  it('returns null when rewards is null', () => {
    mockUseDappSwapComparisonRewardText.mockReturnValue(null);
    mockUseDappSwapContext.mockReturnValue({
      isQuotedSwapDisplayedInInfo: true,
    } as unknown as ReturnType<typeof useDappSwapContext>);

    const { container } = render(<EstimatedPointsSection />);

    expect(container.firstChild).toBeNull();
  });

  it('returns null when isQuotedSwapDisplayedInInfo is false', () => {
    mockUseDappSwapComparisonRewardText.mockReturnValue({
      text: 'Earn up to 100 points',
      estimatedPoints: 100,
    });
    mockUseDappSwapContext.mockReturnValue({
      isQuotedSwapDisplayedInInfo: false,
    } as unknown as ReturnType<typeof useDappSwapContext>);

    const { container } = render(<EstimatedPointsSection />);

    expect(container.firstChild).toBeNull();
  });

  it('renders the section when rewards exist and isQuotedSwapDisplayedInInfo is true', () => {
    mockUseDappSwapComparisonRewardText.mockReturnValue({
      text: 'Earn up to 100 points',
      estimatedPoints: 100,
    });
    mockUseDappSwapContext.mockReturnValue({
      isQuotedSwapDisplayedInInfo: true,
    } as unknown as ReturnType<typeof useDappSwapContext>);

    render(<EstimatedPointsSection />);

    expect(screen.getByTestId('confirm-info-row')).toBeInTheDocument();
    expect(screen.getByTestId('confirm-info-row')).toHaveAttribute(
      'data-label',
      'estimatedPointsRow',
    );
    expect(screen.getByTestId('rewards-badge')).toBeInTheDocument();
    expect(screen.getByTestId('rewards-badge')).toHaveTextContent('100');
  });
});
