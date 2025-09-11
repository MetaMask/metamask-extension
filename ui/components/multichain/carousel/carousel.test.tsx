import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { Carousel } from './carousel';
import { MARGIN_VALUES, MAX_SLIDES, WIDTH_VALUES } from './constants';

jest.mock('react-responsive-carousel', () => ({
  Carousel: ({
    children,
    onChange,
  }: {
    children: React.ReactNode;
    onChange?: (index: number) => void;
  }) => (
    <div className="mock-carousel">
      {children}
      <div className="carousel-dots">
        <button className="dot" onClick={() => onChange?.(1)} />
        <button className="dot" onClick={() => onChange?.(0)} />
      </div>
    </div>
  ),
}));

jest.mock('react-redux', () => ({
  useSelector: jest.fn(),
  useDispatch: () => jest.fn(),
}));

jest.mock('reselect', () => ({
  ...jest.requireActual('reselect'),
  lruMemoize: jest.fn(),
}));

jest.mock('../../../selectors/approvals', () => ({
  selectPendingApproval: jest.fn(),
}));

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

  it('should handle slide removal', () => {
    const mockOnClose = jest.fn();
    const { container, rerender } = render(
      <Carousel slides={mockSlides} onClose={mockOnClose} />,
    );

    const closeButtons = container.querySelectorAll(
      '.mm-carousel-slide__close-button',
    );
    expect(closeButtons).toHaveLength(2);

    fireEvent.click(closeButtons[0]);
    expect(mockOnClose).toHaveBeenCalledWith(false, '1');

    const remainingSlides = mockSlides.filter((s) => s.id !== '1');
    rerender(<Carousel slides={remainingSlides} onClose={mockOnClose} />);

    const updatedCloseButtons = container.querySelectorAll(
      '.mm-carousel-slide__close-button',
    );
    expect(updatedCloseButtons).toHaveLength(1);

    fireEvent.click(updatedCloseButtons[0]);
    expect(mockOnClose).toHaveBeenCalledWith(true, '2');

    const finalSlides = remainingSlides.filter((slide) => slide.id !== '2');
    rerender(<Carousel slides={finalSlides} onClose={mockOnClose} />);

    const finalSlideElements = container.querySelectorAll('.mm-carousel-slide');
    expect(finalSlideElements).toHaveLength(0);
  });

  it('should handle slide navigation', () => {
    const { container } = render(<Carousel slides={mockSlides} />);

    const dots = container.querySelectorAll('.dot');
    if (!dots || dots.length === 0) {
      throw new Error('Carousel dots not found');
    }

    fireEvent.click(dots[1]);

    const slides = container.querySelectorAll('.mm-carousel-slide');
    expect(slides[1].parentElement).toHaveClass('mock-carousel');
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
      margin: `${MARGIN_VALUES.ZERO} ${MARGIN_VALUES.CONTAINER_SIDE}`,
      width: 'calc(100% - 32px)',
    });
  });

  it('should apply correct margin and width for multiple slides', () => {
    const { container } = render(<Carousel slides={mockSlides} />);

    const slides = container.querySelectorAll('.mm-carousel-slide');
    expect(slides[0]).toHaveStyle({
      width: 'calc(98% - 16px)',
    });
    expect(slides[1]).toHaveStyle({
      width: WIDTH_VALUES.STANDARD_SLIDE,
    });

    // first slide margins
    expect(slides[0]).toHaveStyle({
      margin: `${MARGIN_VALUES.ZERO} ${MARGIN_VALUES.ZERO} ${MARGIN_VALUES.SLIDE_BOTTOM} 16px`,
    });
    // subsequent slide margins
    expect(slides[1]).toHaveStyle({
      margin: `${MARGIN_VALUES.ZERO} ${MARGIN_VALUES.ZERO} ${MARGIN_VALUES.SLIDE_BOTTOM} ${MARGIN_VALUES.ZERO}`,
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
    // @ts-expect-error mocking platform
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
    const slidesWithClick = [{ ...mockSlides[0] }];

    const { container } = render(
      <Carousel slides={slidesWithClick} onClick={mockOnClick} />,
    );

    const slide = container.querySelector('.mm-carousel-slide');
    if (!slide) {
      throw new Error('Slide not found');
    }

    fireEvent.click(slide);
    expect(mockOnClick).toHaveBeenCalledWith('1');
  });

  it('should not show close button for undismissable slides', () => {
    const undismissableSlides = [
      { ...mockSlides[0], undismissable: true },
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
    const createSlide = (id: string) => ({
      id,
      title: `Slide ${id}`,
      description: `Description ${id}`,
      image: `imagejpg`,
    });
    const slides = [...Array(MAX_SLIDES)].map((_, i) => createSlide(`${i}`));
    slides.push(createSlide('1 more than max!'));
    slides.push(createSlide('2 more than max!'));
    slides.push(createSlide('3 more than max!'));

    const { container } = render(<Carousel slides={slides} />);

    const visibleSlides = container.querySelectorAll('.mm-carousel-slide');
    expect(visibleSlides).toHaveLength(MAX_SLIDES);
  });
});
