import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { useSelector } from 'react-redux';
import { ThemeType } from '../../../../../../shared/constants/preferences';
import { getPortfolioUrl } from '../../../../../helpers/utils/portfolio';
import { BatchSellEmptySelectTokens } from './batch-sell-empty-select-tokens';

// ─── Dependency mocks ────────────────────────────────────────────────────────

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useSelector: jest.fn(),
}));

jest.mock('../../../../../hooks/useI18nContext', () => ({
  useI18nContext: () => (key: string) => key,
}));

const mockUseTheme = jest.fn();
jest.mock('../../../../../hooks/useTheme', () => ({
  useTheme: () => mockUseTheme(),
}));

jest.mock('../../../../../selectors', () => ({
  getAnalyticsId: jest.fn(),
  getCompletedMetaMetricsOnboarding: jest.fn(),
  getOptedIn: jest.fn(),
  getDataCollectionForMarketing: jest.fn(),
}));

jest.mock('../../../../../helpers/utils/portfolio', () => ({
  getPortfolioUrl: jest.fn(
    () => 'https://portfolio.example.com/explore/tokens',
  ),
}));

// ─── Helpers ─────────────────────────────────────────────────────────────────

const mockUseSelector = jest.mocked(useSelector);
const mockGetPortfolioUrl = jest.mocked(getPortfolioUrl);

// Seed the useSelector calls in component order:
// 1. getAnalyticsId
// 2. getCompletedMetaMetricsOnboarding
// 3. getOptedIn
// 4. getDataCollectionForMarketing
function seedSelectors({
  analyticsId = 'mock-metrics-id',
  completedMetaMetricsOnboarding = true,
  isOptedIn = true,
  isMarketingEnabled = false,
} = {}) {
  mockUseSelector.mockReset();
  mockUseSelector
    .mockReturnValueOnce(analyticsId as never)
    .mockReturnValueOnce(completedMetaMetricsOnboarding as never)
    .mockReturnValueOnce(isOptedIn as never)
    .mockReturnValueOnce(isMarketingEnabled as never);
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('BatchSellEmptySelectTokens', () => {
  beforeEach(() => {
    mockUseTheme.mockReturnValue(ThemeType.light);
    seedSelectors();
    global.platform = {
      openTab: jest.fn(),
    } as unknown as typeof global.platform;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders the container with the correct test id', () => {
    render(<BatchSellEmptySelectTokens />);

    expect(
      screen.getByTestId('batch-sell-select-empty-page'),
    ).toBeInTheDocument();
  });

  it('renders the description text', () => {
    render(<BatchSellEmptySelectTokens />);

    expect(
      screen.getByText('batchSellEmptyStateDescription'),
    ).toBeInTheDocument();
  });

  it('renders the explore tokens button', () => {
    render(<BatchSellEmptySelectTokens />);

    expect(screen.getByText('exploreTokens')).toBeInTheDocument();
  });

  describe('defi icon', () => {
    it('uses the light icon when theme is light', () => {
      mockUseTheme.mockReturnValue(ThemeType.light);
      render(<BatchSellEmptySelectTokens />);

      const img = screen.getByRole('img') as HTMLImageElement;
      expect(img.src).toContain('empty-state-defi-light.png');
    });

    it('uses the dark icon when theme is dark', () => {
      mockUseTheme.mockReturnValue(ThemeType.dark);
      seedSelectors();
      render(<BatchSellEmptySelectTokens />);

      const img = screen.getByRole('img') as HTMLImageElement;
      expect(img.src).toContain('empty-state-defi-dark.png');
    });
  });

  describe('navigateToPortfolioDiscover', () => {
    it('opens a new tab with the portfolio URL when the button is clicked', () => {
      render(<BatchSellEmptySelectTokens />);

      fireEvent.click(screen.getByText('exploreTokens'));

      expect(global.platform.openTab).toHaveBeenCalledTimes(1);
      expect(global.platform.openTab).toHaveBeenCalledWith({
        url: 'https://portfolio.example.com/explore/tokens',
      });
    });

    it('passes the correct arguments to getPortfolioUrl', () => {
      seedSelectors({
        analyticsId: 'test-id',
        completedMetaMetricsOnboarding: true,
        isOptedIn: true,
        isMarketingEnabled: true,
      });

      render(<BatchSellEmptySelectTokens />);
      fireEvent.click(screen.getByText('exploreTokens'));

      expect(mockGetPortfolioUrl).toHaveBeenCalledWith(
        'explore/tokens',
        'ext_batch_sell_empty',
        'test-id',
        true,
        true,
      );
    });

    it('passes updated selector values when they change between renders', () => {
      seedSelectors({
        analyticsId: 'id-a',
        completedMetaMetricsOnboarding: true,
        isOptedIn: false,
        isMarketingEnabled: false,
      });
      const { unmount } = render(<BatchSellEmptySelectTokens />);
      fireEvent.click(screen.getByText('exploreTokens'));

      expect(mockGetPortfolioUrl).toHaveBeenCalledWith(
        'explore/tokens',
        'ext_batch_sell_empty',
        'id-a',
        false,
        false,
      );

      unmount();
      jest.clearAllMocks();

      seedSelectors({
        analyticsId: 'id-b',
        completedMetaMetricsOnboarding: true,
        isOptedIn: true,
        isMarketingEnabled: true,
      });
      render(<BatchSellEmptySelectTokens />);
      fireEvent.click(screen.getByText('exploreTokens'));

      expect(mockGetPortfolioUrl).toHaveBeenCalledWith(
        'explore/tokens',
        'ext_batch_sell_empty',
        'id-b',
        true,
        true,
      );
    });
  });
});
