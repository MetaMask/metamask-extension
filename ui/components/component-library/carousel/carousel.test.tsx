import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { Carousel } from './carousel';

jest.mock('../../../hooks/useI18nContext', () => ({
  useI18nContext: () => (key: string) => key,
}));

describe('Carousel', () => {
  const mockSlides = [
    {
      id: '1',
      title: 'Slide 1',
      description: 'Description 1',
      image: 'image1.jpg',
    },
    {
      id: '2',
      title: 'Slide 2',
      description: 'Description 2',
      image: 'image2.jpg',
    },
  ];

  it('should render correctly with slides', () => {
    const { container } = render(<Carousel slides={mockSlides} />);

    const slides = container.querySelectorAll('.mm-carousel-slide');
    expect(slides).toHaveLength(2);

    const images = container.querySelectorAll('.mm-carousel-slide__accessory');
    expect(images[0]).toHaveAttribute('src', 'image1.jpg');
    expect(images[1]).toHaveAttribute('src', 'image2.jpg');
  });

  it('should handle slide removal', async () => {
    const mockOnClose = jest.fn();
    const { container, rerender } = render(
      <Carousel slides={mockSlides} onClose={mockOnClose} />,
    );

    const closeButtons = container.querySelectorAll(
      '.mm-carousel-slide__close-button',
    );
    expect(closeButtons).toHaveLength(2);

    fireEvent.click(closeButtons[0]);
    expect(mockOnClose).toHaveBeenCalledWith('1');

    const remainingSlides = mockSlides.filter((slide) => slide.id !== '1');
    rerender(<Carousel slides={remainingSlides} onClose={mockOnClose} />);

    const updatedSlides = container.querySelectorAll('.mm-carousel-slide');
    expect(updatedSlides).toHaveLength(1);
  });

  it('should handle slide navigation', () => {
    const { container } = render(<Carousel slides={mockSlides} />);

    const dots = container.querySelectorAll('.dot');
    if (!dots || dots.length === 0) {
      throw new Error('Carousel dots not found');
    }
    fireEvent.click(dots[1]);

    const slides = container.querySelectorAll('.mm-carousel-slide');
    expect(slides[1].parentElement).toHaveClass('selected');
  });

  it('should return null when no slides are present', () => {
    const { container } = render(<Carousel slides={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('should apply correct margin and width for single slide', () => {
    const singleSlide = [mockSlides[0]];
    const { container } = render(<Carousel slides={singleSlide} />);

    const slide = container.querySelector('.mm-carousel-slide');
    expect(slide).toHaveStyle({
      margin: '0 4% 40px 4%',
      width: '100%',
    });
  });

  it('should apply correct margin and width for multiple slides', () => {
    const { container } = render(<Carousel slides={mockSlides} />);

    const slides = container.querySelectorAll('.mm-carousel-slide');
    expect(slides[0]).toHaveStyle({
      width: '96%',
    });
  });

  it('should render loading state correctly', () => {
    const { container } = render(<Carousel slides={mockSlides} isLoading />);

    const loadingCarousel = container.querySelector('.mm-carousel__loading');
    expect(loadingCarousel).toBeDefined();

    const skeletonSlides = container.querySelectorAll('.mm-carousel-slide');
    expect(skeletonSlides).toHaveLength(3);
  });

  it('should handle slide click with href', () => {
    const mockOpenTab = jest.fn();
    global.platform = {
      openTab: mockOpenTab,
      closeCurrentWindow: jest.fn(),
    };

    const slidesWithHref = [
      {
        ...mockSlides[0],
        href: 'https://example.com',
      },
    ];

    const { container } = render(<Carousel slides={slidesWithHref} />);

    const slide = container.querySelector('.mm-carousel-slide');
    if (!slide) {
      throw new Error('Slide not found');
    }
    fireEvent.click(slide);

    expect(mockOpenTab).toHaveBeenCalledWith({ url: 'https://example.com' });
  });

  it('should handle slide click with onClick', () => {
    const mockOnClick = jest.fn();
    const slidesWithClick = [
      {
        ...mockSlides[0],
        onClick: mockOnClick,
      },
    ];

    const { container } = render(<Carousel slides={slidesWithClick} />);

    const slide = container.querySelector('.mm-carousel-slide');
    if (!slide) {
      throw new Error('Slide not found');
    }
    fireEvent.click(slide);

    expect(mockOnClick).toHaveBeenCalled();
  });

  it('should not show close button for undismissable slides', () => {
    const undismissableSlides = [
      {
        ...mockSlides[0],
        undismissable: true,
      },
      mockSlides[1],
    ];

    const { container } = render(
      <Carousel slides={undismissableSlides} onClose={() => undefined} />,
    );

    const closeButtons = container.querySelectorAll(
      '.mm-carousel-slide__close-button',
    );
    expect(closeButtons).toHaveLength(1);
  });

  it('should limit the number of slides to MAX_SLIDES', () => {
    const manySlides = [
      ...mockSlides,
      {
        id: '3',
        title: 'Slide 3',
        description: 'Description 3',
        image: 'image3.jpg',
      },
      {
        id: '4',
        title: 'Slide 4',
        description: 'Description 4',
        image: 'image4.jpg',
      },
      {
        id: '5',
        title: 'Slide 5',
        description: 'Description 5',
        image: 'image5.jpg',
      },
      {
        id: '6',
        title: 'Slide 6',
        description: 'Description 6',
        image: 'image6.jpg',
      },
    ];

    const { container } = render(<Carousel slides={manySlides} />);

    const visibleSlides = container.querySelectorAll('.mm-carousel-slide');
    expect(visibleSlides).toHaveLength(5);
  });
});
