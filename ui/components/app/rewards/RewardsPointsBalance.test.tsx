import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useSelector } from 'react-redux';
import { RewardsPointsBalance } from './RewardsPointsBalance';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { useRewardsContext } from '../../../contexts/rewards';
import type { RewardsContextValue } from '../../../contexts/rewards';
import type { SeasonStatusState } from '../../../../app/scripts/controllers/rewards/rewards-controller.types';

// Mock dependencies
jest.mock('react-redux', () => ({
  useSelector: jest.fn(),
}));

jest.mock('../../../hooks/useI18nContext', () => ({
  useI18nContext: jest.fn(),
}));

jest.mock('../../../contexts/rewards', () => ({
  useRewardsContext: jest.fn(),
}));

jest.mock('../../component-library/skeleton', () => ({
  Skeleton: ({ width }: { width: string }) => (
    <div data-testid="skeleton" style={{ width }}>
      Loading...
    </div>
  ),
}));

const mockUseSelector = useSelector as jest.MockedFunction<typeof useSelector>;
const mockUseI18nContext = useI18nContext as jest.MockedFunction<
  typeof useI18nContext
>;
const mockUseRewardsContext = useRewardsContext as jest.MockedFunction<
  typeof useRewardsContext
>;

describe('RewardsPointsBalance', () => {
  const mockT = jest.fn((key: string, values?: string[]) => {
    if (key === 'rewardsOptIn') return 'Opt In';
    if (key === 'rewardsPointsBalance' && values) return `${values[0]} points`;
    if (key === 'rewardsPointsIcon') return 'Rewards Points Icon';
    return key;
  });

  // Mock season status with complete structure
  const mockSeasonStatus: SeasonStatusState = {
    season: {
      id: 'test-season',
      name: 'Test Season',
      startDate: Date.now() - 86400000, // 1 day ago
      endDate: Date.now() + 86400000, // 1 day from now
      tiers: [],
    },
    balance: {
      total: 1000,
    },
    tier: {
      currentTier: {
        id: 'tier-1',
        name: 'Bronze',
        pointsNeeded: 0,
        image: {
          lightModeUrl: 'light.png',
          darkModeUrl: 'dark.png',
        },
        levelNumber: '1',
        rewards: [],
      },
      nextTier: null,
      nextTierPointsNeeded: null,
    },
  };

  // Mock rewards context value with complete structure
  const mockRewardsContextValue: RewardsContextValue = {
    rewardsEnabled: true,
    candidateSubscriptionId: 'test-subscription-id',
    candidateSubscriptionIdError: false,
    seasonStatus: mockSeasonStatus,
    seasonStatusError: null,
    seasonStatusLoading: false,
    refetchSeasonStatus: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseI18nContext.mockReturnValue(mockT);
    mockUseSelector.mockReturnValue('en-US'); // Default locale
  });

  it('should render null when rewards are not enabled', () => {
    mockUseRewardsContext.mockReturnValue({
      ...mockRewardsContextValue,
      rewardsEnabled: false,
      seasonStatus: null,
      candidateSubscriptionId: null,
    });

    const { container } = render(<RewardsPointsBalance />);
    expect(container.firstChild).toBeNull();
  });

  it('should render opt-in badge when candidateSubscriptionId is null', () => {
    mockUseRewardsContext.mockReturnValue({
      ...mockRewardsContextValue,
      seasonStatus: null,
      candidateSubscriptionId: null,
    });

    render(<RewardsPointsBalance />);

    expect(screen.getByTestId('rewards-points-balance')).toBeInTheDocument();
    expect(
      screen.getByTestId('rewards-points-balance-value'),
    ).toHaveTextContent('Opt In');
    expect(screen.getByAltText('Rewards Points Icon')).toBeInTheDocument();
  });

  it('should render skeleton when loading and no balance exists', () => {
    mockUseRewardsContext.mockReturnValue({
      ...mockRewardsContextValue,
      seasonStatus: null,
      seasonStatusLoading: true,
    });

    render(<RewardsPointsBalance />);

    expect(screen.getByTestId('skeleton')).toBeInTheDocument();
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should not render skeleton when loading but balance exists', () => {
    mockUseRewardsContext.mockReturnValue({
      ...mockRewardsContextValue,
      seasonStatusLoading: true,
    });

    render(<RewardsPointsBalance />);

    expect(screen.queryByTestId('skeleton')).not.toBeInTheDocument();
    expect(screen.getByTestId('rewards-points-balance')).toBeInTheDocument();
    expect(
      screen.getByTestId('rewards-points-balance-value'),
    ).toHaveTextContent('1,000 points');
  });

  it('should render formatted points balance with default locale', () => {
    mockUseRewardsContext.mockReturnValue({
      ...mockRewardsContextValue,
      seasonStatus: {
        ...mockSeasonStatus,
        balance: {
          total: 12345,
        },
      },
    });

    render(<RewardsPointsBalance />);

    expect(screen.getByTestId('rewards-points-balance')).toBeInTheDocument();
    expect(
      screen.getByTestId('rewards-points-balance-value'),
    ).toHaveTextContent('12,345 points');
    expect(screen.getByAltText('Rewards Points Icon')).toBeInTheDocument();
  });

  it('should render formatted points balance with German locale', () => {
    mockUseSelector.mockReturnValue('de-DE');
    mockUseRewardsContext.mockReturnValue({
      ...mockRewardsContextValue,
      seasonStatus: {
        ...mockSeasonStatus,
        balance: {
          total: 12345,
        },
      },
    });

    render(<RewardsPointsBalance />);

    expect(screen.getByTestId('rewards-points-balance')).toBeInTheDocument();
    expect(
      screen.getByTestId('rewards-points-balance-value'),
    ).toHaveTextContent('12.345 points');
  });

  it('should render zero points correctly', () => {
    mockUseRewardsContext.mockReturnValue({
      ...mockRewardsContextValue,
      seasonStatus: {
        ...mockSeasonStatus,
        balance: {
          total: 0,
        },
      },
    });

    render(<RewardsPointsBalance />);

    expect(screen.getByTestId('rewards-points-balance')).toBeInTheDocument();
    expect(
      screen.getByTestId('rewards-points-balance-value'),
    ).toHaveTextContent('0 points');
  });

  it('should handle undefined seasonStatus gracefully', () => {
    mockUseRewardsContext.mockReturnValue({
      ...mockRewardsContextValue,
      seasonStatus: null,
    });

    render(<RewardsPointsBalance />);

    expect(screen.getByTestId('rewards-points-balance')).toBeInTheDocument();
    expect(
      screen.getByTestId('rewards-points-balance-value'),
    ).toHaveTextContent('0 points');
  });

  it('should render with correct CSS classes and structure', () => {
    mockUseRewardsContext.mockReturnValue(mockRewardsContextValue);

    render(<RewardsPointsBalance />);

    const container = screen.getByTestId('rewards-points-balance');
    expect(container).toHaveClass(
      'flex',
      'items-center',
      'gap-2',
      'px-2',
      'bg-background-muted',
      'rounded',
    );

    const image = screen.getByAltText('Rewards Points Icon');
    expect(image).toHaveAttribute(
      'src',
      './images/metamask-rewards-points.svg',
    );
    expect(image).toHaveStyle({ width: '16px', height: '16px' });
  });

  it('should call useSelector with getIntlLocale selector', () => {
    mockUseRewardsContext.mockReturnValue(mockRewardsContextValue);

    render(<RewardsPointsBalance />);

    expect(mockUseSelector).toHaveBeenCalled();
  });

  it('should call useI18nContext hook', () => {
    mockUseRewardsContext.mockReturnValue(mockRewardsContextValue);

    render(<RewardsPointsBalance />);

    expect(mockUseI18nContext).toHaveBeenCalled();
  });

  it('should call useRewardsContext hook', () => {
    mockUseRewardsContext.mockReturnValue(mockRewardsContextValue);

    render(<RewardsPointsBalance />);

    expect(mockUseRewardsContext).toHaveBeenCalled();
  });
});
