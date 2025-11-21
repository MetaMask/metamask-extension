import React from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  selectCandidateSubscriptionId,
  selectOnboardingModalRendered,
  selectRewardsBadgeHidden,
  selectRewardsEnabled,
  selectRewardsOnboardingEnabled,
  selectSeasonStatus,
  selectSeasonStatusError,
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

jest.mock('../../../store/store', () => ({
  useAppSelector: jest.fn(),
}));

jest.mock('../../../../shared/lib/storage-helpers', () => ({
  getStorageItem: jest.fn(),
  setStorageItem: jest.fn(),
}));

const mockUseSelector = useSelector as jest.MockedFunction<typeof useSelector>;
const mockUseDispatch = useDispatch as jest.MockedFunction<typeof useDispatch>;

const { useAppSelector } = jest.requireMock('../../../store/store');
const { getStorageItem, setStorageItem } = jest.requireMock(
  '../../../../shared/lib/storage-helpers',
);

const mockUseAppSelector = useAppSelector as jest.MockedFunction<
  typeof useAppSelector
>;
const mockGetStorageItem = getStorageItem as jest.MockedFunction<
  typeof getStorageItem
>;
const mockSetStorageItem = setStorageItem as jest.MockedFunction<
  typeof setStorageItem
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

  const setSelectorValues = ({
    locale = 'en-US',
    rewardsEnabled = true,
    rewardsOnboardingEnabled = true,
    rewardsBadgeHidden = false,
    candidateSubscriptionId = 'test-subscription-id',
    seasonStatus = mockSeasonStatus,
    seasonStatusError = null,
    rewardsActiveAccountSubscriptionId = 'active-subscription-id',
    hasSeenOnboarding = true,
    onboardingModalRendered = true,
  }: {
    locale?: string;
    rewardsEnabled?: boolean;
    rewardsOnboardingEnabled?: boolean;
    rewardsBadgeHidden?: boolean;
    candidateSubscriptionId?: string | null;
    seasonStatus?: typeof mockSeasonStatus | null;
    seasonStatusError?: string | null;
    rewardsActiveAccountSubscriptionId?: string | undefined;
    hasSeenOnboarding?: boolean;
    onboardingModalRendered?: boolean;
  }) => {
    mockUseSelector.mockImplementation((selector: unknown) => {
      if (selector === getIntlLocale) {
        return locale;
      }
      if (selector === selectRewardsEnabled) {
        return rewardsEnabled;
      }
      if (selector === selectRewardsOnboardingEnabled) {
        return rewardsOnboardingEnabled;
      }
      if (selector === selectRewardsBadgeHidden) {
        return rewardsBadgeHidden;
      }
      if (selector === selectCandidateSubscriptionId) {
        return candidateSubscriptionId;
      }
      if (selector === selectSeasonStatus) {
        return seasonStatus;
      }
      if (selector === selectSeasonStatusError) {
        return seasonStatusError;
      }
      if (selector === selectOnboardingModalRendered) {
        return onboardingModalRendered;
      }
      if (selector === selectSeasonStatusError) {
        return seasonStatusError;
      }
      return undefined;
    });

    mockUseAppSelector.mockImplementation(
      (selector: (state: unknown) => unknown) => {
        // Create a mock state structure that matches what the selector expects
        const mockState = {
          metamask: {
            rewardsActiveAccount: rewardsActiveAccountSubscriptionId
              ? { subscriptionId: rewardsActiveAccountSubscriptionId }
              : undefined,
          },
        };
        return selector(mockState);
      },
    );

    mockGetStorageItem.mockResolvedValue(hasSeenOnboarding ? 'true' : null);
  };

  beforeEach(() => {
    jest.clearAllMocks();
    setSelectorValues({});
    mockUseDispatch.mockReturnValue(jest.fn());
    mockSetStorageItem.mockResolvedValue(undefined);
    // Set IN_TEST to prevent onboarding modal from opening
    process.env.IN_TEST = 'true';
  });

  afterEach(() => {
    delete process.env.IN_TEST;
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
    setSelectorValues({
      candidateSubscriptionId: null,
      seasonStatus: null,
      rewardsOnboardingEnabled: true,
      rewardsBadgeHidden: false,
    });
    render(<RewardsPointsBalance />);
    const container = screen.getByTestId('rewards-points-balance');
    expect(container).toBeInTheDocument();
    // Displays i18n key returned by mocked t('rewardsSignUp') without suffix
    expect(
      screen.getByTestId('rewards-points-balance-value'),
    ).toHaveTextContent('rewardsSignUp');
  });

  it('should render skeleton when candidateSubscriptionId is pending and no active subscription', () => {
    setSelectorValues({
      seasonStatus: null,
      candidateSubscriptionId: 'pending',
      rewardsActiveAccountSubscriptionId: undefined,
    });
    render(<RewardsPointsBalance />);
    expect(screen.getByTestId('skeleton')).toBeInTheDocument();
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should render skeleton when candidateSubscriptionId is retry and no active subscription', () => {
    setSelectorValues({
      seasonStatus: null,
      candidateSubscriptionId: 'retry',
      rewardsActiveAccountSubscriptionId: undefined,
    });
    render(<RewardsPointsBalance />);
    expect(screen.getByTestId('skeleton')).toBeInTheDocument();
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should not render skeleton when candidateSubscriptionId is pending but active subscription exists', () => {
    setSelectorValues({
      candidateSubscriptionId: 'pending',
      rewardsActiveAccountSubscriptionId: 'active-subscription-id',
    });
    render(<RewardsPointsBalance />);
    expect(screen.queryByTestId('skeleton')).not.toBeInTheDocument();
    expect(screen.getByTestId('rewards-points-balance')).toBeInTheDocument();
    expect(
      screen.getByTestId('rewards-points-balance-value'),
    ).toHaveTextContent('1,000 points');
  });

  it('should not render skeleton when balance exists and not loading', () => {
    setSelectorValues({
      candidateSubscriptionId: 'test-subscription-id',
      rewardsActiveAccountSubscriptionId: undefined,
    });
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

  it('should render skeleton when seasonStatus is undefined', () => {
    setSelectorValues({ seasonStatus: null });
    render(<RewardsPointsBalance />);
    expect(screen.getByTestId('skeleton')).toBeInTheDocument();
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
  });

  it('should handle undefined balance total gracefully', async () => {
    setSelectorValues({
      seasonStatus: {
        ...mockSeasonStatus,
        balance: { total: undefined as unknown as number },
      } as unknown as typeof mockSeasonStatus,
    });
    await act(async () => {
      render(<RewardsPointsBalance />);
    });
    await waitFor(() => {
      expect(screen.getByTestId('rewards-points-balance')).toBeInTheDocument();
    });
    expect(
      screen.getByTestId('rewards-points-balance-value'),
    ).toHaveTextContent('0 points');
  });

  it('should handle null balance gracefully', async () => {
    setSelectorValues({
      seasonStatus: {
        ...mockSeasonStatus,
        balance: null as unknown as { total: number },
      } as unknown as typeof mockSeasonStatus,
    });
    await act(async () => {
      render(<RewardsPointsBalance />);
    });
    await waitFor(() => {
      expect(screen.getByTestId('rewards-points-balance')).toBeInTheDocument();
    });
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

  it('should render skeleton when seasonStatus is null and not loading', () => {
    setSelectorValues({
      seasonStatus: null,
      candidateSubscriptionId: 'test-subscription-id',
    });
    render(<RewardsPointsBalance />);
    expect(screen.getByTestId('skeleton')).toBeInTheDocument();
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
      candidateSubscriptionId: 'test-subscription-id',
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
      candidateSubscriptionId: 'test-subscription-id',
    });

    render(<RewardsPointsBalance />);

    const container = screen.getByTestId('rewards-points-balance');
    const textElement = screen.getByTestId('rewards-points-balance-value');

    expect(container).toHaveClass('gap-1', 'bg-background-transparent');
    expect(textElement).toHaveClass('text-alternative');
    expect(textElement).toHaveTextContent("Couldn't load");
  });

  it('should render error state even when subscriptionId is loading (no balance)', () => {
    setSelectorValues({
      seasonStatus: null,
      seasonStatusError: 'Error occurred',
      candidateSubscriptionId: 'pending',
      rewardsActiveAccountSubscriptionId: undefined,
    });

    render(<RewardsPointsBalance />);

    const container = screen.getByTestId('rewards-points-balance');
    const textElement = screen.getByTestId('rewards-points-balance-value');

    expect(container).toHaveClass('gap-1', 'bg-background-transparent');
    expect(textElement).toHaveClass('text-alternative');
    expect(textElement).toHaveTextContent("Couldn't load");
  });

  it('should render error state when candidateSubscriptionId is error', () => {
    setSelectorValues({
      seasonStatus: null,
      seasonStatusError: null,
      candidateSubscriptionId: 'error',
    });

    render(<RewardsPointsBalance />);

    const container = screen.getByTestId('rewards-points-balance');
    const textElement = screen.getByTestId('rewards-points-balance-value');

    expect(container).toHaveClass('gap-1', 'bg-background-transparent');
    expect(textElement).toHaveClass('text-alternative');
    expect(textElement).toHaveTextContent("Couldn't load");
  });

  it('should not open onboarding modal when hasSeenOnboarding is true', () => {
    const dispatchMock = jest.fn();
    mockUseDispatch.mockReturnValue(dispatchMock);
    setSelectorValues({ hasSeenOnboarding: true });

    render(<RewardsPointsBalance />);

    expect(dispatchMock).not.toHaveBeenCalled();
  });

  it('should not open onboarding modal in test environment even if hasSeenOnboarding is false', () => {
    const dispatchMock = jest.fn();
    mockUseDispatch.mockReturnValue(dispatchMock);
    setSelectorValues({ hasSeenOnboarding: false });
    process.env.IN_TEST = 'true';

    render(<RewardsPointsBalance />);

    expect(dispatchMock).not.toHaveBeenCalled();
  });

  it('should not open onboarding modal when onboardingModalRendered is false', () => {
    const dispatchMock = jest.fn();
    mockUseDispatch.mockReturnValue(dispatchMock);
    delete process.env.IN_TEST;
    setSelectorValues({
      hasSeenOnboarding: false,
      candidateSubscriptionId: null,
      rewardsActiveAccountSubscriptionId: undefined,
      onboardingModalRendered: false,
    });

    render(<RewardsPointsBalance />);

    expect(dispatchMock).not.toHaveBeenCalled();
  });

  it('should call setStorageItem when candidateSubscriptionId is set', async () => {
    setSelectorValues({
      candidateSubscriptionId: 'new-subscription-id',
      rewardsActiveAccountSubscriptionId: undefined,
    });

    await act(async () => {
      render(<RewardsPointsBalance />);
    });

    await waitFor(() => {
      expect(mockSetStorageItem).toHaveBeenCalledWith(
        'REWARDS_GTM_MODAL_SHOWN',
        'true',
      );
    });
  });

  it('should handle setStorageItem errors gracefully', async () => {
    mockSetStorageItem.mockRejectedValue(new Error('Storage error'));
    setSelectorValues({
      candidateSubscriptionId: 'new-subscription-id',
      rewardsActiveAccountSubscriptionId: undefined,
    });

    await act(async () => {
      render(<RewardsPointsBalance />);
    });

    await waitFor(() => {
      expect(screen.getByTestId('rewards-points-balance')).toBeInTheDocument();
    });
    // Component should still render despite storage error
    expect(
      screen.getByTestId('rewards-points-balance-value'),
    ).toHaveTextContent('1,000 points');
  });

  it('should handle getStorageItem errors gracefully', async () => {
    mockGetStorageItem.mockRejectedValue(new Error('Storage error'));
    setSelectorValues({});

    await act(async () => {
      render(<RewardsPointsBalance />);
    });

    await waitFor(() => {
      expect(screen.getByTestId('rewards-points-balance')).toBeInTheDocument();
    });
    // Component should still render despite storage error
    expect(
      screen.getByTestId('rewards-points-balance-value'),
    ).toHaveTextContent('1,000 points');
  });
});
