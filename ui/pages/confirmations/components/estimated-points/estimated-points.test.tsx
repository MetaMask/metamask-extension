import React from 'react';
import { render, screen } from '@testing-library/react';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { useDappSwapComparisonRewardText } from '../../hooks/transactions/dapp-swap-comparison/useDappSwapComparisonRewardText';
import { useConfirmContext } from '../../context/confirm';
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

jest.mock('../../context/confirm', () => ({
  useConfirmContext: jest.fn(),
}));

jest.mock('../../../../components/app/confirm/info/row', () => ({
  ConfirmInfoRow: ({ children, label }: any) => (
    <div data-testid="confirm-info-row" data-label={label}>
      {children}
    </div>
  ),
}));

jest.mock('../../../../components/app/confirm/info/row/section', () => ({
  ConfirmInfoSection: ({ children }: any) => (
    <div data-testid="confirm-info-section">{children}</div>
  ),
}));

jest.mock('../../../../components/app/rewards/RewardsBadge', () => ({
  RewardsBadge: ({ formattedPoints }: any) => (
    <div data-testid="rewards-badge">{formattedPoints}</div>
  ),
}));

const mockUseI18nContext = jest.mocked(useI18nContext);
const mockUseDappSwapComparisonRewardText = jest.mocked(
  useDappSwapComparisonRewardText,
);
const mockUseConfirmContext = jest.mocked(useConfirmContext);

describe('EstimatedPointsSection', () => {
  const mockT = jest.fn((key) => key);

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseI18nContext.mockReturnValue(mockT);
  });

  it('returns null when rewards is null', () => {
    mockUseDappSwapComparisonRewardText.mockReturnValue(null);
    mockUseConfirmContext.mockReturnValue({
      isQuotedSwapDisplayedInInfo: true,
    } as unknown as ReturnType<typeof useConfirmContext>);

    const { container } = render(<EstimatedPointsSection />);

    expect(container.firstChild).toBeNull();
  });

  it('returns null when isQuotedSwapDisplayedInInfo is false', () => {
    mockUseDappSwapComparisonRewardText.mockReturnValue({
      text: 'Earn up to 100 points',
      estimatedPoints: 100,
    });
    mockUseConfirmContext.mockReturnValue({
      isQuotedSwapDisplayedInInfo: false,
    } as unknown as ReturnType<typeof useConfirmContext>);

    const { container } = render(<EstimatedPointsSection />);

    expect(container.firstChild).toBeNull();
  });

  it('renders the section when rewards exist and isQuotedSwapDisplayedInInfo is true', () => {
    mockUseDappSwapComparisonRewardText.mockReturnValue({
      text: 'Earn up to 100 points',
      estimatedPoints: 100,
    });
    mockUseConfirmContext.mockReturnValue({
      isQuotedSwapDisplayedInInfo: true,
    } as unknown as ReturnType<typeof useConfirmContext>);

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
