import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  selectCandidateSubscriptionId,
  selectRewardsEnabled,
  selectSeasonStatus,
  selectSeasonStatusError,
  selectSeasonStatusLoading,
} from '../../../ducks/rewards/selectors';
import { getIntlLocale } from '../../../ducks/locale/locale';
import { RewardsPointsBalance } from './RewardsPointsBalance';

// Mock dependencies
jest.mock('react-redux', () => ({
  useSelector: jest.fn(),
  useDispatch: jest.fn(() => jest.fn()),
}));

// Mock rewards hooks to avoid side effects during tests
jest.mock('../../../hooks/rewards/useCandidateSubscriptionId', () => ({
  useCandidateSubscriptionId: () => ({
    fetchCandidateSubscriptionId: jest.fn(),
  }),
}));
jest.mock('../../../hooks/rewards/useSeasonStatus', () => ({
  useSeasonStatus: jest.fn(),
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

jest.mock('../../component-library/skeleton', () => ({
  Skeleton: ({ width }: { width: string }) => (
    <div data-testid="skeleton" style={{ width }}>
      Loading...
    </div>
  ),
}));

const mockUseSelector = useSelector as jest.MockedFunction<typeof useSelector>;
const mockUseDispatch = useDispatch as jest.MockedFunction<typeof useDispatch>;

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

  const setSelectorValues = ({
    locale = 'en-US',
    rewardsEnabled = true,
    candidateSubscriptionId = 'test-subscription-id',
    seasonStatus = mockSeasonStatus,
    seasonStatusLoading = false,
    seasonStatusError = null,
  }: {
    locale?: string;
    rewardsEnabled?: boolean;
    candidateSubscriptionId?: string | null;
    seasonStatus?: typeof mockSeasonStatus | null;
    seasonStatusLoading?: boolean;
    seasonStatusError?: string | null;
  }) => {
    mockUseSelector.mockImplementation((selector: unknown) => {
      if (selector === getIntlLocale) {
        return locale;
      }
      if (selector === selectRewardsEnabled) {
        return rewardsEnabled;
      }
      if (selector === selectCandidateSubscriptionId) {
        return candidateSubscriptionId;
      }
      if (selector === selectSeasonStatus) {
        return seasonStatus;
      }
      if (selector === selectSeasonStatusLoading) {
        return seasonStatusLoading;
      }
      if (selector === selectSeasonStatusError) {
        return seasonStatusError;
      }
      return undefined;
    });
  };

  beforeEach(() => {
    jest.clearAllMocks();
    setSelectorValues({});
    mockUseDispatch.mockReturnValue(jest.fn());
  });

  it('should render null when rewards are not enabled', () => {
    setSelectorValues({
      rewardsEnabled: false,
      candidateSubscriptionId: null,
      seasonStatus: null,
    });
    const { container } = render(<RewardsPointsBalance />);
    expect(container.firstChild).toBeNull();
  });

  it('should render sign-up badge when candidateSubscriptionId is null', () => {
    setSelectorValues({ candidateSubscriptionId: null, seasonStatus: null });
    render(<RewardsPointsBalance />);
    const container = screen.getByTestId('rewards-points-balance');
    expect(container).toBeInTheDocument();
    // Displays i18n key returned by mocked t('rewardsSignUp') without suffix
    expect(
      screen.getByTestId('rewards-points-balance-value'),
    ).toHaveTextContent('rewardsSignUp');
  });

  it('should render skeleton when loading and no balance exists', () => {
    setSelectorValues({ seasonStatus: null, seasonStatusLoading: true });
    render(<RewardsPointsBalance />);
    expect(screen.getByTestId('skeleton')).toBeInTheDocument();
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should not render skeleton when loading but balance exists', () => {
    setSelectorValues({ seasonStatusLoading: true });
    render(<RewardsPointsBalance />);
    expect(screen.queryByTestId('skeleton')).not.toBeInTheDocument();
    expect(screen.getByTestId('rewards-points-balance')).toBeInTheDocument();
    expect(
      screen.getByTestId('rewards-points-balance-value'),
    ).toHaveTextContent('1,000 points');
  });

  it('should render formatted points balance with default locale', () => {
    setSelectorValues({
      seasonStatus: { ...mockSeasonStatus, balance: { total: 12345 } },
    });
    render(<RewardsPointsBalance />);
    expect(screen.getByTestId('rewards-points-balance')).toBeInTheDocument();
    expect(
      screen.getByTestId('rewards-points-balance-value'),
    ).toHaveTextContent('12,345 points');
    expect(screen.getByAltText('Rewards Points Icon')).toBeInTheDocument();
  });

  it('should render formatted points balance with German locale', () => {
    setSelectorValues({
      locale: 'de-DE',
      seasonStatus: { ...mockSeasonStatus, balance: { total: 12345 } },
    });
    render(<RewardsPointsBalance />);
    expect(screen.getByTestId('rewards-points-balance')).toBeInTheDocument();
    expect(
      screen.getByTestId('rewards-points-balance-value'),
    ).toHaveTextContent('12.345 points');
  });

  it('should render zero points correctly', () => {
    setSelectorValues({
      seasonStatus: { ...mockSeasonStatus, balance: { total: 0 } },
    });
    render(<RewardsPointsBalance />);
    expect(screen.getByTestId('rewards-points-balance')).toBeInTheDocument();
    expect(
      screen.getByTestId('rewards-points-balance-value'),
    ).toHaveTextContent('0 points');
  });

  it('should handle undefined seasonStatus gracefully', () => {
    setSelectorValues({ seasonStatus: null });
    render(<RewardsPointsBalance />);
    expect(screen.getByTestId('rewards-points-balance')).toBeInTheDocument();
    expect(
      screen.getByTestId('rewards-points-balance-value'),
    ).toHaveTextContent('0 points');
  });

  it('should render with correct CSS classes and structure', () => {
    setSelectorValues({});
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
    setSelectorValues({});
    render(<RewardsPointsBalance />);
    expect(mockUseSelector).toHaveBeenCalledWith(getIntlLocale);
  });

  it('should select rewards values from Redux', () => {
    setSelectorValues({});
    render(<RewardsPointsBalance />);
    expect(mockUseSelector).toHaveBeenCalledWith(selectRewardsEnabled);
    expect(mockUseSelector).toHaveBeenCalledWith(selectSeasonStatus);
    expect(mockUseSelector).toHaveBeenCalledWith(selectSeasonStatusLoading);
    expect(mockUseSelector).toHaveBeenCalledWith(selectCandidateSubscriptionId);
  });

  it('should handle undefined balance total gracefully', () => {
    setSelectorValues({
      seasonStatus: {
        ...mockSeasonStatus,
        balance: { total: undefined as unknown as number },
      } as unknown as typeof mockSeasonStatus,
    });
    render(<RewardsPointsBalance />);
    expect(screen.getByTestId('rewards-points-balance')).toBeInTheDocument();
    expect(
      screen.getByTestId('rewards-points-balance-value'),
    ).toHaveTextContent('0 points');
  });

  it('should handle null balance gracefully', () => {
    setSelectorValues({
      seasonStatus: {
        ...mockSeasonStatus,
        balance: null as unknown as { total: number },
      } as unknown as typeof mockSeasonStatus,
    });
    render(<RewardsPointsBalance />);
    expect(screen.getByTestId('rewards-points-balance')).toBeInTheDocument();
    expect(
      screen.getByTestId('rewards-points-balance-value'),
    ).toHaveTextContent('0 points');
  });

  it('should format large numbers correctly with US locale', () => {
    setSelectorValues({
      locale: 'en-US',
      seasonStatus: { ...mockSeasonStatus, balance: { total: 1234567 } },
    });
    render(<RewardsPointsBalance />);
    expect(
      screen.getByTestId('rewards-points-balance-value'),
    ).toHaveTextContent('1,234,567 points');
  });

  it('should format numbers correctly with French locale', () => {
    setSelectorValues({
      locale: 'fr-FR',
      seasonStatus: { ...mockSeasonStatus, balance: { total: 12345 } },
    });
    render(<RewardsPointsBalance />);
    expect(
      screen.getByTestId('rewards-points-balance-value'),
    ).toHaveTextContent('12 345 points');
  });

  it('should format numbers correctly with Spanish locale', () => {
    setSelectorValues({
      locale: 'es-ES',
      seasonStatus: { ...mockSeasonStatus, balance: { total: 12345 } },
    });
    render(<RewardsPointsBalance />);
    expect(
      screen.getByTestId('rewards-points-balance-value'),
    ).toHaveTextContent('12.345 points');
  });

  it('should not render skeleton when seasonStatus is null and not loading', () => {
    setSelectorValues({ seasonStatus: null, seasonStatusLoading: false });
    render(<RewardsPointsBalance />);
    expect(screen.queryByTestId('skeleton')).not.toBeInTheDocument();
    expect(screen.getByTestId('rewards-points-balance')).toBeInTheDocument();
  });

  it('should apply correct boxClassName to RewardsBadge', () => {
    setSelectorValues({});
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
  });

  it('should render error state when seasonStatusError exists and no balance', () => {
    setSelectorValues({
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
    setSelectorValues({
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
    setSelectorValues({
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
