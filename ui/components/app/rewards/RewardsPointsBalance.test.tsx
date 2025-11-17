import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useSelector } from 'react-redux';
import { useRewardsContext } from '../../../contexts/rewards';
import type { RewardsContextValue } from '../../../contexts/rewards';
import { getIntlLocale } from '../../../ducks/locale/locale';
import { RewardsPointsBalance } from './RewardsPointsBalance';

// Mock dependencies
jest.mock('react-redux', () => ({
  useSelector: jest.fn(),
}));

jest.mock('../../../hooks/useI18nContext', () => ({
  useI18nContext: jest.fn(() => (key: string, values?: string[]) => {
    if (key === 'rewardsPointsBalance' && values) {
      return `${values[0]} points`;
    }
    if (key === 'rewardsPointsIcon') {
      return 'Rewards Points Icon';
    }
    if (key === 'rewardsPointsBalance_couldntLoad') {
      return "Couldn't load";
    }
    return key;
  }),
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
const mockUseRewardsContext = useRewardsContext as jest.MockedFunction<
  typeof useRewardsContext
>;

describe('RewardsPointsBalance', () => {
  // Mock season status with complete structure
  const mockSeasonStatus = {
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

  it('should render null when candidateSubscriptionId is null', () => {
    mockUseRewardsContext.mockReturnValue({
      ...mockRewardsContextValue,
      seasonStatus: null,
      candidateSubscriptionId: null,
    });

    const { container } = render(<RewardsPointsBalance />);
    expect(container.firstChild).toBeNull();
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
      'gap-1',
      'px-1.5',
      'bg-background-muted',
      'rounded',
    );

    const image = screen.getByAltText('Rewards Points Icon');
    expect(image).toHaveAttribute(
      'src',
      './images/metamask-rewards-points.svg',
    );
  });

  it('should call useSelector with getIntlLocale selector', () => {
    mockUseRewardsContext.mockReturnValue(mockRewardsContextValue);

    render(<RewardsPointsBalance />);

    expect(mockUseSelector).toHaveBeenCalledWith(getIntlLocale);
  });

  it('should call useRewardsContext hook', () => {
    mockUseRewardsContext.mockReturnValue(mockRewardsContextValue);

    render(<RewardsPointsBalance />);

    expect(mockUseRewardsContext).toHaveBeenCalled();
  });

  it('should handle undefined balance total gracefully', () => {
    mockUseRewardsContext.mockReturnValue({
      ...mockRewardsContextValue,
      seasonStatus: {
        ...mockSeasonStatus,
        balance: {
          total: undefined as unknown as number,
        },
      },
    });

    render(<RewardsPointsBalance />);

    expect(screen.getByTestId('rewards-points-balance')).toBeInTheDocument();
    expect(
      screen.getByTestId('rewards-points-balance-value'),
    ).toHaveTextContent('0 points');
  });

  it('should handle null balance gracefully', () => {
    mockUseRewardsContext.mockReturnValue({
      ...mockRewardsContextValue,
      seasonStatus: {
        ...mockSeasonStatus,
        balance: null as unknown as { total: number },
      },
    });

    render(<RewardsPointsBalance />);

    expect(screen.getByTestId('rewards-points-balance')).toBeInTheDocument();
    expect(
      screen.getByTestId('rewards-points-balance-value'),
    ).toHaveTextContent('0 points');
  });

  it('should format large numbers correctly with US locale', () => {
    mockUseSelector.mockReturnValue('en-US');
    mockUseRewardsContext.mockReturnValue({
      ...mockRewardsContextValue,
      seasonStatus: {
        ...mockSeasonStatus,
        balance: {
          total: 1234567,
        },
      },
    });

    render(<RewardsPointsBalance />);

    expect(
      screen.getByTestId('rewards-points-balance-value'),
    ).toHaveTextContent('1,234,567 points');
  });

  it('should format numbers correctly with French locale', () => {
    mockUseSelector.mockReturnValue('fr-FR');
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

    expect(
      screen.getByTestId('rewards-points-balance-value'),
    ).toHaveTextContent('12 345 points');
  });

  it('should format numbers correctly with Spanish locale', () => {
    mockUseSelector.mockReturnValue('es-ES');
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

    expect(
      screen.getByTestId('rewards-points-balance-value'),
    ).toHaveTextContent('12.345 points');
  });

  it('should not render skeleton when seasonStatus is null and not loading', () => {
    mockUseRewardsContext.mockReturnValue({
      ...mockRewardsContextValue,
      seasonStatus: null,
      seasonStatusLoading: false,
    });

    render(<RewardsPointsBalance />);

    expect(screen.queryByTestId('skeleton')).not.toBeInTheDocument();
    expect(screen.getByTestId('rewards-points-balance')).toBeInTheDocument();
  });

  it('should apply correct boxClassName to RewardsBadge', () => {
    mockUseRewardsContext.mockReturnValue(mockRewardsContextValue);

    render(<RewardsPointsBalance />);

    const container = screen.getByTestId('rewards-points-balance');
    expect(container).toHaveClass(
      'gap-1',
      'px-1.5',
      'bg-background-muted',
      'rounded',
    );
  });

  it('should render error state when seasonStatusError exists and no balance', () => {
    mockUseRewardsContext.mockReturnValue({
      ...mockRewardsContextValue,
      seasonStatus: null,
      seasonStatusError: 'Failed to fetch season status',
      seasonStatusLoading: false,
    });

    render(<RewardsPointsBalance />);

    const container = screen.getByTestId('rewards-points-balance');
    expect(container).toBeInTheDocument();
    expect(container).toHaveClass('gap-1', 'bg-background-transparent');
    expect(
      screen.getByTestId('rewards-points-balance-value'),
    ).toHaveTextContent("Couldn't load");
  });

  it('should render error state with correct props when seasonStatusError exists', () => {
    mockUseRewardsContext.mockReturnValue({
      ...mockRewardsContextValue,
      seasonStatus: null,
      seasonStatusError: 'Network error',
      seasonStatusLoading: false,
    });

    render(<RewardsPointsBalance />);

    const container = screen.getByTestId('rewards-points-balance');
    const textElement = screen.getByTestId('rewards-points-balance-value');

    expect(container).toHaveClass('gap-1', 'bg-background-transparent');
    expect(textElement).toHaveClass('text-alternative');
    expect(textElement).toHaveTextContent("Couldn't load");
  });

  it('should not render error state when loading', () => {
    mockUseRewardsContext.mockReturnValue({
      ...mockRewardsContextValue,
      seasonStatus: null,
      seasonStatusError: 'Error occurred',
      seasonStatusLoading: true,
    });

    render(<RewardsPointsBalance />);

    expect(screen.getByTestId('skeleton')).toBeInTheDocument();
    expect(
      screen.queryByTestId('rewards-points-balance'),
    ).not.toBeInTheDocument();
  });
});
