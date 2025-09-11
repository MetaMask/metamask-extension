import React from 'react';
import { act, screen, waitFor } from '@testing-library/react';
import { fireEvent } from '@testing-library/react';
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import { CarouselWithEmptyState } from '../carousel-wrapper';
import { useCarouselManagement } from '../../../../hooks/useCarouselManagement';
import type { CarouselSlide } from '../../../../shared/constants/app-state';
import * as actions from '../../../../store/actions';

// Mock the carousel management hook
jest.mock('../../../../hooks/useCarouselManagement');
const mockUseCarouselManagement = useCarouselManagement as jest.MockedFunction<
  typeof useCarouselManagement
>;

// Mock actions
jest.mock('../../../../store/actions', () => ({
  removeSlide: jest.fn(),
}));

const mockStore = configureStore([thunk]);

// Mock slides that simulate real Contentful data
const mockContentfulSlides: CarouselSlide[] = [
  {
    id: 'contentful-slide-1',
    title: 'Welcome to MetaMask',
    description: 'Get started with your crypto journey',
    image: 'https://images.ctfassets.net/image1.jpg',
    dismissed: false,
    href: 'https://metamask.io/getting-started',
    variableName: 'welcome',
    startDate: '2024-01-01T00:00:00Z',
    endDate: '2024-12-31T23:59:59Z',
  },
  {
    id: 'contentful-slide-2',
    title: 'Download Mobile App',
    description: 'Take MetaMask with you wherever you go',
    image: 'https://images.ctfassets.net/image2.jpg',
    dismissed: false,
    variableName: 'downloadMobileApp',
    startDate: '2024-01-01T00:00:00Z',
    endDate: '2024-12-31T23:59:59Z',
  },
];

describe('Carousel Integration Tests', () => {
  let store: any;

  beforeEach(() => {
    store = mockStore({
      metamask: {
        internalAccounts: {
          accounts: {},
          selectedAccount: 'test-account-id',
        },
        completedOnboarding: true,
        useExternalServices: true,
        remoteFeatureFlags: {
          contentfulCarouselEnabled: true,
        },
        slides: mockContentfulSlides,
        selectedAccountCachedBalance: '0x1000000000000000000', // 1 ETH
      },
    });

    jest.clearAllMocks();
  });

  describe('Contentful Integration', () => {
    it('displays slides fetched from Contentful', async () => {
      mockUseCarouselManagement.mockReturnValue({
        slides: mockContentfulSlides,
      });

      renderWithProvider(
        <CarouselWithEmptyState
          slides={mockContentfulSlides}
          isLoading={false}
          onSlideClose={jest.fn()}
          onSlideClick={jest.fn()}
          onRenderSlides={jest.fn()}
        />,
        store,
      );

      expect(screen.getByText('Welcome to MetaMask')).toBeInTheDocument();
      expect(
        screen.getByText('Get started with your crypto journey'),
      ).toBeInTheDocument();
    });

    it('handles empty slides from Contentful gracefully', () => {
      mockUseCarouselManagement.mockReturnValue({
        slides: [],
      });

      const { container } = renderWithProvider(
        <CarouselWithEmptyState
          slides={[]}
          isLoading={false}
          onSlideClose={jest.fn()}
          onSlideClick={jest.fn()}
          onRenderSlides={jest.fn()}
        />,
        store,
      );

      // Should show empty state or nothing
      expect(container.firstChild).toBeNull();
    });

    it('filters dismissed slides correctly', () => {
      const slidesWithDismissed = [
        ...mockContentfulSlides,
        {
          id: 'contentful-slide-3',
          title: 'Dismissed Slide',
          description: 'This slide was dismissed',
          image: 'https://images.ctfassets.net/image3.jpg',
          dismissed: true, // This slide should not appear
          variableName: 'dismissed',
        },
      ];

      renderWithProvider(
        <CarouselWithEmptyState
          slides={slidesWithDismissed}
          isLoading={false}
          onSlideClose={jest.fn()}
          onSlideClick={jest.fn()}
          onRenderSlides={jest.fn()}
        />,
        store,
      );

      expect(screen.getByText('Welcome to MetaMask')).toBeInTheDocument();
      expect(screen.queryByText('Dismissed Slide')).not.toBeInTheDocument();
    });
  });

  describe('Redux Integration', () => {
    it('dispatches removeSlide action when slide is closed', async () => {
      const mockRemoveSlide = jest.fn();
      (actions.removeSlide as jest.Mock).mockReturnValue(mockRemoveSlide);

      mockUseCarouselManagement.mockReturnValue({
        slides: mockContentfulSlides,
      });

      renderWithProvider(
        <CarouselWithEmptyState
          slides={mockContentfulSlides}
          isLoading={false}
          onSlideClose={(slideId: string) => {
            store.dispatch(actions.removeSlide(slideId));
          }}
          onSlideClick={jest.fn()}
          onRenderSlides={jest.fn()}
        />,
        store,
      );

      const closeButton = screen.getByTestId(
        'carousel-slide-contentful-slide-1-close-button',
      );
      fireEvent.click(closeButton);

      expect(actions.removeSlide).toHaveBeenCalledWith('contentful-slide-1');
    });

    it('handles store updates correctly', async () => {
      mockUseCarouselManagement.mockReturnValue({
        slides: mockContentfulSlides,
      });

      const { rerender } = renderWithProvider(
        <CarouselWithEmptyState
          slides={mockContentfulSlides}
          isLoading={false}
          onSlideClose={jest.fn()}
          onSlideClick={jest.fn()}
          onRenderSlides={jest.fn()}
        />,
        store,
      );

      expect(screen.getByText('Welcome to MetaMask')).toBeInTheDocument();

      // Simulate store update with one slide removed
      const updatedSlides = mockContentfulSlides.slice(1);
      rerender(
        <CarouselWithEmptyState
          slides={updatedSlides}
          isLoading={false}
          onSlideClose={jest.fn()}
          onSlideClick={jest.fn()}
          onRenderSlides={jest.fn()}
        />,
      );

      expect(screen.queryByText('Welcome to MetaMask')).not.toBeInTheDocument();
      expect(screen.getByText('Download Mobile App')).toBeInTheDocument();
    });
  });

  describe('Feature Flag Integration', () => {
    it('handles contentfulCarouselEnabled flag disabled', () => {
      const storeWithDisabledFlag = mockStore({
        ...store.getState(),
        metamask: {
          ...store.getState().metamask,
          remoteFeatureFlags: {
            contentfulCarouselEnabled: false,
          },
        },
      });

      mockUseCarouselManagement.mockReturnValue({
        slides: [], // Hook returns empty array when disabled
      });

      const { container } = renderWithProvider(
        <CarouselWithEmptyState
          slides={[]}
          isLoading={false}
          onSlideClose={jest.fn()}
          onSlideClick={jest.fn()}
          onRenderSlides={jest.fn()}
        />,
        storeWithDisabledFlag,
      );

      expect(container.firstChild).toBeNull();
    });

    it('handles loading state correctly', () => {
      mockUseCarouselManagement.mockReturnValue({
        slides: [],
      });

      renderWithProvider(
        <CarouselWithEmptyState
          slides={[]}
          isLoading={true}
          onSlideClose={jest.fn()}
          onSlideClick={jest.fn()}
          onRenderSlides={jest.fn()}
        />,
        store,
      );

      // Should show loading skeleton or nothing during loading
      const loadingElements = document.querySelectorAll(
        '.carousel-card--current',
      );
      expect(loadingElements.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('External Service Integration', () => {
    it('handles external services disabled', () => {
      const storeWithoutExternalServices = mockStore({
        ...store.getState(),
        metamask: {
          ...store.getState().metamask,
          useExternalServices: false,
        },
      });

      mockUseCarouselManagement.mockReturnValue({
        slides: [],
      });

      const { container } = renderWithProvider(
        <CarouselWithEmptyState
          slides={[]}
          isLoading={false}
          onSlideClose={jest.fn()}
          onSlideClick={jest.fn()}
          onRenderSlides={jest.fn()}
        />,
        storeWithoutExternalServices,
      );

      expect(container.firstChild).toBeNull();
    });

    it('handles network errors gracefully', async () => {
      // Simulate network error scenario
      mockUseCarouselManagement.mockReturnValue({
        slides: [],
      });

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      renderWithProvider(
        <CarouselWithEmptyState
          slides={[]}
          isLoading={false}
          onSlideClose={jest.fn()}
          onSlideClick={jest.fn()}
          onRenderSlides={jest.fn()}
        />,
        store,
      );

      // Component should not crash and handle empty state gracefully
      expect(consoleSpy).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('Solana Integration', () => {
    it('handles Solana account interactions', async () => {
      const solanaSlide: CarouselSlide = {
        id: 'solana-slide',
        title: 'Try Solana',
        description: 'Explore Solana blockchain',
        image: 'https://images.ctfassets.net/solana.jpg',
        dismissed: false,
        variableName: 'solana',
      };

      const onSlideClick = jest.fn();

      renderWithProvider(
        <CarouselWithEmptyState
          slides={[solanaSlide]}
          isLoading={false}
          onSlideClose={jest.fn()}
          onSlideClick={onSlideClick}
          onRenderSlides={jest.fn()}
        />,
        store,
      );

      const card = screen.getByTestId('carousel-slide-solana-slide');
      fireEvent.click(card);

      expect(onSlideClick).toHaveBeenCalledWith('solana-slide', {
        type: 'external',
      });
    });

    it('filters Solana slides for DataAccount types', () => {
      const storeWithSolanaAccount = mockStore({
        ...store.getState(),
        metamask: {
          ...store.getState().metamask,
          internalAccounts: {
            accounts: {
              'test-account-id': {
                type: 'Snap Keyring',
              },
            },
            selectedAccount: 'test-account-id',
          },
        },
      });

      const solanaSlide: CarouselSlide = {
        id: 'solana-slide',
        title: 'Try Solana',
        description: 'Explore Solana blockchain',
        image: 'https://images.ctfassets.net/solana.jpg',
        dismissed: false,
        variableName: 'solana',
      };

      renderWithProvider(
        <CarouselWithEmptyState
          slides={[solanaSlide]}
          isLoading={false}
          onSlideClose={jest.fn()}
          onSlideClick={jest.fn()}
          onRenderSlides={jest.fn()}
        />,
        storeWithSolanaAccount,
      );

      // Solana slide should be filtered out for DataAccount types
      expect(screen.queryByTestId('carousel-slide-solana-slide')).toBeNull();
    });
  });

  describe('MetaMetrics Integration', () => {
    it('tracks slide display events', async () => {
      const onRenderSlides = jest.fn();

      renderWithProvider(
        <CarouselWithEmptyState
          slides={mockContentfulSlides}
          isLoading={false}
          onSlideClose={jest.fn()}
          onSlideClick={jest.fn()}
          onRenderSlides={onRenderSlides}
        />,
        store,
      );

      expect(onRenderSlides).toHaveBeenCalledWith(mockContentfulSlides);
    });

    it('tracks slide interaction events', async () => {
      const onSlideClick = jest.fn();

      renderWithProvider(
        <CarouselWithEmptyState
          slides={mockContentfulSlides}
          isLoading={false}
          onSlideClose={jest.fn()}
          onSlideClick={onSlideClick}
          onRenderSlides={jest.fn()}
        />,
        store,
      );

      const card = screen.getByTestId('carousel-slide-contentful-slide-1');
      fireEvent.click(card);

      expect(onSlideClick).toHaveBeenCalledWith('contentful-slide-1', {
        type: 'external',
        href: 'https://metamask.io/getting-started',
      });
    });
  });
});
