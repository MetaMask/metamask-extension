import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { Carousel } from './carousel';

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
    const { getByText } = render(<Carousel slides={mockSlides} />);

    expect(getByText('Slide 1')).toBeDefined();
    expect(getByText('Description 1')).toBeDefined();
    expect(getByText('Slide 2')).toBeDefined();
    expect(getByText('Description 2')).toBeDefined();
  });

  it('should handle slide removal', () => {
    const mockOnClose = jest.fn();
    const { getByText, queryByText } = render(
      <Carousel slides={mockSlides} onClose={mockOnClose} />,
    );

    const closeButtons = document.querySelectorAll(
      '.mm-banner-base__close-button',
    );
    fireEvent.click(closeButtons[0]);

    expect(queryByText('Slide 1')).toBeNull();
    expect(getByText('Slide 2')).toBeDefined();
    expect(mockOnClose).toHaveBeenCalledWith('1');
  });

  it('should handle onChange callback', () => {
    const mockOnChange = jest.fn();
    render(<Carousel slides={mockSlides} onChange={mockOnChange} />);

    const carousel = document.querySelector('.carousel');
    if (!carousel) {
      throw new Error('Carousel element not found');
    }
    fireEvent.keyDown(carousel, { key: 'ArrowRight' });

    expect(mockOnChange).toHaveBeenCalled();
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
