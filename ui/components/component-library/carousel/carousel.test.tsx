import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';
import { Carousel } from './carousel';

// Mock the useI18nContext hook
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

    // Simulate parent component updating slides after onClose
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

    // Check if the second slide is now active
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
});
