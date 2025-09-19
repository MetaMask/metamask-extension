import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import { ThemeType } from '../../../../../../shared/constants/preferences';
import { NftEmptyState } from './nft-empty-state';

// Mock the useI18nContext hook
jest.mock('../../../../../hooks/useI18nContext', () => ({
  useI18nContext: () => (key: string) => {
    const translations: Record<string, string> = {
      nftEmptyDescription: "There's a world of NFTs out there. Start your collection today.",
      discoverNFTs: 'Discover NFTs',
      nft: 'NFT',
    };
    return translations[key] || key;
  },
}));

// Mock the portfolio utility
jest.mock('../../../../../helpers/utils/portfolio', () => ({
  getPortfolioUrl: jest.fn(() => 'https://portfolio.metamask.io/explore/nfts?test=params'),
}));

// Mock selectors
jest.mock('../../../../../selectors', () => ({
  getTheme: jest.fn(),
  getMetaMetricsId: jest.fn(),
  getParticipateInMetaMetrics: jest.fn(),
  getDataCollectionForMarketing: jest.fn(),
}));

// Mock React useContext for MetaMetricsContext
const mockTrackEvent = jest.fn();
jest.mock('react', () => ({
  ...jest.requireActual('react'),
  useContext: jest.fn((context) => {
    if (context.displayName === 'MetaMetricsContext') {
      return mockTrackEvent;
    }
    return jest.requireActual('react').useContext(context);
  }),
}));

// Mock global platform
const mockOpenTab = jest.fn();
global.platform = {
  openTab: mockOpenTab,
};

describe('NftEmptyState', () => {
  const mockStore = configureStore([]);

  let store: ReturnType<typeof mockStore>;
  let mockSelectors: any;

  beforeEach(() => {
    store = mockStore({
      metamask: {
        preferences: { theme: ThemeType.light },
        metaMetricsId: 'test-metrics-id',
        participateInMetaMetrics: true,
        dataCollectionForMarketing: true,
      },
    });

    // Reset selector mocks
    mockSelectors = require('../../../../../selectors');
    mockSelectors.getTheme.mockReturnValue(ThemeType.light);
    mockSelectors.getMetaMetricsId.mockReturnValue('test-metrics-id');
    mockSelectors.getParticipateInMetaMetrics.mockReturnValue(true);
    mockSelectors.getDataCollectionForMarketing.mockReturnValue(true);

    jest.clearAllMocks();
  });

  const renderComponent = (props = {}) => {
    return render(
      <Provider store={store}>
        <NftEmptyState {...props} />
      </Provider>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render the component with correct test id', () => {
      renderComponent();

      expect(screen.getByTestId('nft-tab-empty-state')).toBeInTheDocument();
    });

    it('should render with light theme icon by default', () => {
      renderComponent();

      const image = screen.getByAltText('NFT');
      expect(image).toBeInTheDocument();
      expect(image).toHaveAttribute('src', './images/empty-state-nfts-light.png');
      expect(image).toHaveAttribute('width', '72');
      expect(image).toHaveAttribute('height', '72');
    });

    it('should render with dark theme icon when theme is dark', () => {
      const darkThemeState = {
        ...defaultState,
        metamask: {
          ...defaultState.metamask,
          preferences: {
            theme: ThemeType.dark,
          },
        },
      };

      renderComponent({}, darkThemeState);

      const image = screen.getByAltText('NFT');
      expect(image).toHaveAttribute('src', './images/empty-state-nfts-dark.png');
    });

    it('should render description text', () => {
      renderComponent();

      expect(
        screen.getByText("There's a world of NFTs out there. Start your collection today.")
      ).toBeInTheDocument();
    });

    it('should render discover button', () => {
      renderComponent();

      expect(
        screen.getByRole('button', { name: 'Discover NFTs' })
      ).toBeInTheDocument();
    });

    it('should apply custom className when provided', () => {
      const customClassName = 'custom-test-class';
      renderComponent({ className: customClassName });

      const emptyState = screen.getByTestId('nft-tab-empty-state');
      expect(emptyState).toHaveClass(customClassName);
    });
  });

  describe('User Interactions', () => {
    it('should call openTab when discover button is clicked', () => {
      renderComponent();

      const discoverButton = screen.getByRole('button', { name: 'Discover NFTs' });
      fireEvent.click(discoverButton);

      expect(mockOpenTab).toHaveBeenCalledTimes(1);
      expect(mockOpenTab).toHaveBeenCalledWith({
        url: 'https://portfolio.metamask.io/explore/nfts?test=params',
      });
    });

    it('should handle button click when MetaMetrics is disabled', () => {
      const noMetricsState = {
        ...defaultState,
        metamask: {
          ...defaultState.metamask,
          participateInMetaMetrics: false,
        },
      };

      renderComponent({}, noMetricsState);

      const discoverButton = screen.getByRole('button', { name: 'Discover NFTs' });
      fireEvent.click(discoverButton);

      expect(mockOpenTab).toHaveBeenCalledTimes(1);
    });
  });

  describe('Portfolio URL Generation', () => {
    it('should call getPortfolioUrl with correct parameters', () => {
      const { getPortfolioUrl } = require('../../../../../helpers/utils/portfolio');

      renderComponent();

      const discoverButton = screen.getByRole('button', { name: 'Discover NFTs' });
      fireEvent.click(discoverButton);

      expect(getPortfolioUrl).toHaveBeenCalledWith(
        'explore/nfts',
        'ext_nft_empty_state_button',
        'test-metrics-id',
        true, // participateInMetaMetrics
        true, // dataCollectionForMarketing
      );
    });

    it('should handle missing metaMetricsId', () => {
      const noIdState = {
        ...defaultState,
        metamask: {
          ...defaultState.metamask,
          metaMetricsId: null,
        },
      };

      renderComponent({}, noIdState);

      const discoverButton = screen.getByRole('button', { name: 'Discover NFTs' });
      fireEvent.click(discoverButton);

      expect(mockOpenTab).toHaveBeenCalledTimes(1);
    });
  });

  describe('Theme Variations', () => {
    it('should use light theme icon by default', () => {
      mockSelectors.getTheme.mockReturnValue(ThemeType.light);
      renderComponent();
      expect(screen.getByAltText('NFT')).toHaveAttribute('src', './images/empty-state-nfts-light.png');
    });

    it('should use dark theme icon when theme is dark', () => {
      mockSelectors.getTheme.mockReturnValue(ThemeType.dark);
      renderComponent();
      expect(screen.getByAltText('NFT')).toHaveAttribute('src', './images/empty-state-nfts-dark.png');
    });
  });

  describe('Accessibility', () => {
    it('should have proper alt text for the image', () => {
      renderComponent();

      const image = screen.getByAltText('NFT');
      expect(image).toBeInTheDocument();
    });

    it('should have a clickable button with proper text', () => {
      renderComponent();

      const button = screen.getByRole('button', { name: 'Discover NFTs' });
      expect(button).toBeInTheDocument();
      expect(button).toBeEnabled();
    });

    it('should have descriptive test id', () => {
      renderComponent();

      expect(screen.getByTestId('nft-tab-empty-state')).toBeInTheDocument();
    });
  });

  describe('Component Integration', () => {
    it('should integrate properly with TabEmptyState component', () => {
      renderComponent();

      // Verify all TabEmptyState features are working
      expect(screen.getByTestId('nft-tab-empty-state')).toBeInTheDocument();
      expect(screen.getByAltText('NFT')).toBeInTheDocument();
      expect(screen.getByText("There's a world of NFTs out there. Start your collection today.")).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Discover NFTs' })).toBeInTheDocument();
    });

    it('should handle all required props correctly', () => {
      const customClassName = 'test-custom-class';
      renderComponent({ className: customClassName });

      const container = screen.getByTestId('nft-tab-empty-state');
      expect(container).toHaveClass(customClassName);
    });
  });

  describe('Error Handling', () => {
    it('should handle missing metaMetricsId', () => {
      mockSelectors.getMetaMetricsId.mockReturnValue(null);
      expect(() => renderComponent()).not.toThrow();
    });

    it('should render without throwing errors', () => {
      expect(() => renderComponent()).not.toThrow();
    });
  });
});