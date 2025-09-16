import React from 'react';
import { render, screen } from '@testing-library/react';
import { Carousel } from '../carousel';

// Mock Redux hooks
jest.mock('react-redux', () => ({
  useSelector: jest.fn(() => ({ address: '0x123' })), // Mock selected account
}));

// Mock the hooks and components that might cause issues
jest.mock('../../../../hooks/useI18nContext', () => ({
  useI18nContext: () => (key: string) => key,
}));

// Mock the animation hooks
jest.mock('../animations/useTransitionToNextCard', () => ({
  useTransitionToNextCard: () => ({
    transitionToNextCard: jest.fn(),
    isTransitioning: false,
  }),
}));

jest.mock('../animations/useTransitionToEmpty', () => ({
  useTransitionToEmpty: () => ({
    startEmptyStateSequence: jest.fn(),
    isEmptyStateFolding: false,
  }),
}));

// Simple mock slides for testing
const mockSlides = [
  {
    id: 'test-slide-1',
    title: 'Test Slide 1',
    description: 'Test description 1',
    image: 'https://example.com/image1.jpg',
    dismissed: false,
    variableName: 'test1',
  },
  {
    id: 'test-slide-2',
    title: 'Test Slide 2',
    description: 'Test description 2',
    image: 'https://example.com/image2.jpg',
    dismissed: false,
    variableName: 'test2',
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

  it('renders without crashing', () => {
    render(<Carousel {...defaultProps} />);
    expect(
      screen.getByTestId('carousel-slide-test-slide-1'),
    ).toBeInTheDocument();
  });

  it('renders slide titles and descriptions', () => {
    render(<Carousel {...defaultProps} />);

    expect(screen.getByText('Test Slide 1')).toBeInTheDocument();
    expect(screen.getByText('Test description 1')).toBeInTheDocument();
  });

  it('renders empty state when no slides', () => {
    render(<Carousel {...defaultProps} slides={[]} />);

    // Should show empty state message
    expect(screen.getByText('carouselAllCaughtUp')).toBeInTheDocument();
  });

  it('shows loading state when loading', () => {
    render(<Carousel {...defaultProps} isLoading={true} />);

    // Should not render slides when loading
    expect(screen.queryByText('Test Slide 1')).not.toBeInTheDocument();
  });

  it('applies custom className', () => {
    const customClass = 'custom-carousel';
    const { container } = render(
      <Carousel {...defaultProps} className={customClass} />,
    );

    expect(container.firstChild).toHaveClass(customClass);
  });

  it('calls onRenderSlides when slides are provided', () => {
    const onRenderSlidesMock = jest.fn();
    render(<Carousel {...defaultProps} onRenderSlides={onRenderSlidesMock} />);

    expect(onRenderSlidesMock).toHaveBeenCalledWith(mockSlides);
  });

  it('filters out dismissed slides', () => {
    const slidesWithDismissed = [
      ...mockSlides,
      {
        id: 'dismissed-slide',
        title: 'Dismissed Slide',
        description: 'Should not show',
        image: 'https://example.com/dismissed.jpg',
        dismissed: true,
        variableName: 'dismissed',
      },
    ];

    render(<Carousel {...defaultProps} slides={slidesWithDismissed} />);

    // Should not show dismissed slide
    expect(screen.queryByText('Dismissed Slide')).not.toBeInTheDocument();
    // Should still show non-dismissed slides
    expect(screen.getByText('Test Slide 1')).toBeInTheDocument();
  });
});
