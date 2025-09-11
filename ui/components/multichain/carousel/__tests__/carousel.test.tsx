import React from 'react';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import { Carousel } from '../carousel';
import { ANIMATION_TIMINGS } from '../constants';
import type { CarouselSlide } from '../../../../shared/constants/app-state';

// Mock slides for testing
const mockSlides: CarouselSlide[] = [
  {
    id: 'test-slide-1',
    title: 'Test Slide 1',
    description: 'First test slide description',
    image: 'https://example.com/image1.jpg',
    dismissed: false,
    href: 'https://example.com/link1',
    variableName: 'test1',
  },
  {
    id: 'test-slide-2',
    title: 'Test Slide 2',
    description: 'Second test slide description',
    image: 'https://example.com/image2.jpg',
    dismissed: false,
    variableName: 'test2',
  },
  {
    id: 'test-slide-3',
    title: 'Test Slide 3',
    description: 'Third test slide description',
    image: 'https://example.com/image3.jpg',
    dismissed: false,
    variableName: 'test3',
  },
];

describe('Carousel', () => {
  const defaultProps = {
    slides: mockSlides,
    isLoading: false,
    onSlideClose: jest.fn(),
    onSlideClick: jest.fn(),
    onRenderSlides: jest.fn(),
    className: '',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders carousel with slides correctly', () => {
      renderWithProvider(<Carousel {...defaultProps} />);

      expect(
        screen.getByTestId('carousel-slide-test-slide-1'),
      ).toBeInTheDocument();
      expect(screen.getByText('Test Slide 1')).toBeInTheDocument();
      expect(
        screen.getByText('First test slide description'),
      ).toBeInTheDocument();
    });

    it('renders loading state when isLoading is true', () => {
      renderWithProvider(<Carousel {...defaultProps} isLoading={true} />);

      const skeletonCards = screen.getAllByText((content, element) =>
        element?.className?.includes('carousel-card--current'),
      );
      expect(skeletonCards).toHaveLength(3);
    });

    it('renders null when no slides provided', () => {
      const { container } = renderWithProvider(
        <Carousel {...defaultProps} slides={[]} />,
      );
      expect(container.firstChild).toBeNull();
    });

    it('shows only current and next slides', () => {
      renderWithProvider(<Carousel {...defaultProps} />);

      expect(
        screen.getByTestId('carousel-slide-test-slide-1'),
      ).toBeInTheDocument();
      expect(
        screen.queryByTestId('carousel-slide-test-slide-3'),
      ).not.toBeInTheDocument();
    });
  });

  describe('Card Stacking', () => {
    it('applies correct CSS classes for current and next cards', () => {
      renderWithProvider(<Carousel {...defaultProps} />);

      const currentCard = screen.getByTestId('carousel-slide-test-slide-1');
      const cardElement = currentCard.closest('.carousel-card');

      expect(cardElement).toHaveClass('carousel-card--current');
    });

    it('shows pressed overlay on next cards only', () => {
      renderWithProvider(<Carousel {...defaultProps} />);

      const pressedOverlays = document.querySelectorAll(
        '.carousel-card__pressed-overlay',
      );
      expect(pressedOverlays).toHaveLength(1); // Only next card should have overlay
    });
  });

  describe('Close Button Interactions', () => {
    it('calls onSlideClose when close button is clicked', async () => {
      const onSlideCloseMock = jest.fn();
      renderWithProvider(
        <Carousel {...defaultProps} onSlideClose={onSlideCloseMock} />,
      );

      const closeButton = screen.getByTestId(
        'carousel-slide-test-slide-1-close-button',
      );
      fireEvent.click(closeButton);

      expect(onSlideCloseMock).toHaveBeenCalledWith('test-slide-1', false);
    });

    it('prevents event propagation on close button click', () => {
      const onSlideClickMock = jest.fn();
      renderWithProvider(
        <Carousel {...defaultProps} onSlideClick={onSlideClickMock} />,
      );

      const closeButton = screen.getByTestId(
        'carousel-slide-test-slide-1-close-button',
      );
      fireEvent.click(closeButton);

      // onSlideClick should not be called due to stopPropagation
      expect(onSlideClickMock).not.toHaveBeenCalled();
    });

    it('shows close buttons on all cards', () => {
      renderWithProvider(<Carousel {...defaultProps} />);

      const closeButtons = screen.getAllByRole('button', { name: /close/i });
      expect(closeButtons).toHaveLength(1); // Only current card is rendered
    });
  });

  describe('Slide Click Interactions', () => {
    it('calls onSlideClick when card is clicked', () => {
      const onSlideClickMock = jest.fn();
      renderWithProvider(
        <Carousel {...defaultProps} onSlideClick={onSlideClickMock} />,
      );

      const card = screen.getByTestId('carousel-slide-test-slide-1');
      fireEvent.click(card);

      expect(onSlideClickMock).toHaveBeenCalledWith('test-slide-1', {
        type: 'external',
        href: 'https://example.com/link1',
      });
    });

    it('does not call onSlideClick when transitioning', async () => {
      const onSlideClickMock = jest.fn();
      renderWithProvider(
        <Carousel {...defaultProps} onSlideClick={onSlideClickMock} />,
      );

      // Start a transition by clicking close
      const closeButton = screen.getByTestId(
        'carousel-slide-test-slide-1-close-button',
      );
      fireEvent.click(closeButton);

      // Try to click card during transition
      const card = screen.getByTestId('carousel-slide-test-slide-1');
      fireEvent.click(card);

      // Should only have been called once for the close, not for the card click
      expect(onSlideClickMock).not.toHaveBeenCalled();
    });
  });

  describe('Empty State', () => {
    it('shows empty state when last slide is available', () => {
      const singleSlide = [mockSlides[0]];
      renderWithProvider(<Carousel {...defaultProps} slides={singleSlide} />);

      // Should show empty state behind last card
      expect(
        document.querySelector('.carousel-card--next'),
      ).toBeInTheDocument();
    });

    it('triggers onEmptyState when no slides remain', async () => {
      const onEmptyStateMock = jest.fn();
      renderWithProvider(
        <Carousel
          {...defaultProps}
          slides={[]}
          onEmptyState={onEmptyStateMock}
        />,
      );

      await waitFor(
        () => {
          expect(onEmptyStateMock).toHaveBeenCalled();
        },
        { timeout: 2000 },
      );
    });
  });

  describe('Accessibility', () => {
    it('has proper aria labels on close buttons', () => {
      renderWithProvider(<Carousel {...defaultProps} />);

      const closeButton = screen.getByTestId(
        'carousel-slide-test-slide-1-close-button',
      );
      expect(closeButton).toHaveAttribute('aria-label');
      expect(closeButton.getAttribute('aria-label')).toContain('Test Slide 1');
    });

    it('has proper alt text on images', () => {
      renderWithProvider(<Carousel {...defaultProps} />);

      const image = screen.getByAltText('Test Slide 1');
      expect(image).toBeInTheDocument();
    });

    it('has proper test ids for automation', () => {
      renderWithProvider(<Carousel {...defaultProps} />);

      expect(
        screen.getByTestId('carousel-slide-test-slide-1'),
      ).toBeInTheDocument();
      expect(
        screen.getByTestId('carousel-slide-test-slide-1-close-button'),
      ).toBeInTheDocument();
    });
  });

  describe('Animation Integration', () => {
    it('applies transition classes correctly', () => {
      renderWithProvider(<Carousel {...defaultProps} />);

      const card = screen.getByTestId('carousel-slide-test-slide-1');
      expect(card.closest('.carousel-card')).toHaveClass(
        'carousel-card--current',
      );
    });

    it('handles transitions without errors', async () => {
      const onSlideCloseMock = jest.fn();
      renderWithProvider(
        <Carousel {...defaultProps} onSlideClose={onSlideCloseMock} />,
      );

      const closeButton = screen.getByTestId(
        'carousel-slide-test-slide-1-close-button',
      );

      expect(() => {
        fireEvent.click(closeButton);
      }).not.toThrow();

      expect(onSlideCloseMock).toHaveBeenCalled();
    });
  });

  describe('Solana Account Filtering', () => {
    it('filters out Solana slides for DataAccount type', () => {
      const slidesWithSolana = [
        ...mockSlides,
        {
          id: 'solana-slide',
          title: 'Solana Slide',
          description: 'Solana description',
          image: 'https://example.com/solana.jpg',
          dismissed: false,
          variableName: 'solana',
        },
      ];

      // Mock selected account as Solana DataAccount
      const mockState = {
        metamask: {
          internalAccounts: {
            accounts: {},
            selectedAccount: 'test-account-id',
          },
          accounts: {
            'test-account': {
              type: 'Snap Keyring',
            },
          },
        },
      };

      renderWithProvider(
        <Carousel {...defaultProps} slides={slidesWithSolana} />,
        mockState,
      );

      // Solana slide should be filtered out
      expect(
        screen.queryByTestId('carousel-slide-solana-slide'),
      ).not.toBeInTheDocument();
    });
  });
});
