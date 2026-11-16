import React from 'react';
import { act, render, screen } from '@testing-library/react';
import { SlidingTextCarousel } from './sliding-text-carousel';

describe('SlidingTextCarousel', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders a single text statically without slots', () => {
    const { container } = render(
      <SlidingTextCarousel texts={['Only one headline']} />,
    );

    expect(screen.getByText('Only one headline')).toBeInTheDocument();
    expect(
      container.querySelector('.market-insights-carousel'),
    ).not.toBeInTheDocument();
  });

  it('renders the first text initially', () => {
    render(<SlidingTextCarousel texts={['First', 'Second', 'Third']} />);

    expect(screen.getByText('First')).toBeInTheDocument();
  });

  it('advances to the next text after the rotate interval', () => {
    jest.useFakeTimers();
    render(<SlidingTextCarousel texts={['First', 'Second', 'Third']} />);

    act(() => {
      jest.advanceTimersByTime(5000 + 350);
    });

    expect(screen.queryByText('First')).not.toBeInTheDocument();
    expect(screen.getByText('Second')).toBeInTheDocument();
  });

  it('calls onSlideStart and onSlideComplete for each rotation', () => {
    jest.useFakeTimers();
    const onSlideStart = jest.fn();
    const onSlideComplete = jest.fn();
    render(
      <SlidingTextCarousel
        texts={['First', 'Second']}
        onSlideStart={onSlideStart}
        onSlideComplete={onSlideComplete}
      />,
    );

    act(() => {
      jest.advanceTimersByTime(5000 + 350);
    });

    expect(onSlideStart).toHaveBeenCalledTimes(1);
    expect(onSlideComplete).toHaveBeenCalledTimes(1);
  });

  it('cycles back to earlier texts after exhausting the list', () => {
    jest.useFakeTimers();
    render(<SlidingTextCarousel texts={['First', 'Second']} />);

    // First rotation shows the second text.
    act(() => {
      jest.advanceTimersByTime(5000 + 350);
    });
    expect(screen.getByText('Second')).toBeInTheDocument();

    // Second rotation cycles back to the first text.
    act(() => {
      jest.advanceTimersByTime(5000 + 350);
    });
    expect(screen.getByText('First')).toBeInTheDocument();

    // Third rotation shows the second text again.
    act(() => {
      jest.advanceTimersByTime(5000 + 350);
    });
    expect(screen.getByText('Second')).toBeInTheDocument();
  });

  it('applies the optional test id to the container', () => {
    render(
      <SlidingTextCarousel
        texts={['First', 'Second']}
        testId="carousel-test"
      />,
    );

    expect(screen.getByTestId('carousel-test')).toBeInTheDocument();
  });
});
