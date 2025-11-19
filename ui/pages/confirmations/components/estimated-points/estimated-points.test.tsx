import React from 'react';
import { render, screen } from '@testing-library/react';
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

jest.mock('../../hooks/transactions/dapp-swap-comparison/useSwapCheck', () => ({
  useSwapCheck: jest.fn(),
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

const { useI18nContext } = require('../../../../hooks/useI18nContext');
const {
  useDappSwapComparisonRewardText,
} = require('../../hooks/transactions/dapp-swap-comparison/useDappSwapComparisonRewardText');
const {
  useSwapCheck,
} = require('../../hooks/transactions/dapp-swap-comparison/useSwapCheck');

describe('EstimatedPointsSection', () => {
  const mockT = jest.fn((key) => key);

  beforeEach(() => {
    jest.clearAllMocks();
    useI18nContext.mockReturnValue(mockT);
  });

  it('returns null when rewards is null', () => {
    useDappSwapComparisonRewardText.mockReturnValue(null);
    useSwapCheck.mockReturnValue({ isQuotedSwap: true });

    const { container } = render(<EstimatedPointsSection />);

    expect(container.firstChild).toBeNull();
  });

  it('returns null when isQuotedSwap is false', () => {
    useDappSwapComparisonRewardText.mockReturnValue({
      text: 'Earn up to 100 points',
      estimatedPoints: 100,
    });
    useSwapCheck.mockReturnValue({ isQuotedSwap: false });

    const { container } = render(<EstimatedPointsSection />);

    expect(container.firstChild).toBeNull();
  });

  it('renders the section when rewards exist and isQuotedSwap is true', () => {
    useDappSwapComparisonRewardText.mockReturnValue({
      text: 'Earn up to 100 points',
      estimatedPoints: 100,
    });
    useSwapCheck.mockReturnValue({ isQuotedSwap: true });

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
