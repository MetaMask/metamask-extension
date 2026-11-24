import React from 'react';
import { act, fireEvent, screen } from '@testing-library/react';
import { enLocale as messages } from '../../../../../test/lib/i18n-helpers';
import { renderWithProvider as render } from '../../../../../test/lib/render-helpers-navigate';
import { SlidingTextCarousel } from './sliding-text-carousel';

describe('SlidingTextCarousel', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders a single text statically without slots', () => {
    render(<SlidingTextCarousel texts={['Only one headline']} />);

    expect(screen.getByText('Only one headline')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
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

  it('slides the incoming headline in without exposing the offscreen headline', () => {
    jest.useFakeTimers();
    render(<SlidingTextCarousel texts={['First', 'Second']} />);
    const firstSlot = screen.getByText('First').parentElement;
    const secondSlot = screen.getByText('Second').parentElement;
    expect(secondSlot).toHaveAttribute('aria-hidden', 'true');
    expect(secondSlot).toHaveClass('translate-x-full');

    act(() => jest.advanceTimersByTime(5000));
    expect(secondSlot).toHaveClass('translate-x-0');
    act(() => jest.advanceTimersByTime(350));
    expect(firstSlot).toHaveAttribute('aria-hidden', 'true');
    expect(secondSlot).toHaveAttribute('aria-hidden', 'false');
  });

  it('keeps the rotation schedule when the same headlines are passed again', () => {
    jest.useFakeTimers();
    const { rerender } = render(
      <SlidingTextCarousel texts={['First', 'Second']} />,
    );
    act(() => jest.advanceTimersByTime(4000));
    const onSlideStart = jest.fn();
    rerender(
      <SlidingTextCarousel
        texts={['First', 'Second']}
        onSlideStart={onSlideStart}
      />,
    );
    act(() => jest.advanceTimersByTime(1000));
    expect(onSlideStart).toHaveBeenCalledTimes(1);
  });

  it('cancels a pending slide when unmounted', () => {
    jest.useFakeTimers();
    const onSlideComplete = jest.fn();
    const { unmount } = render(
      <SlidingTextCarousel
        texts={['First', 'Second']}
        onSlideComplete={onSlideComplete}
      />,
    );
    act(() => jest.advanceTimersByTime(5000));
    unmount();
    act(() => jest.advanceTimersByTime(350));
    expect(onSlideComplete).not.toHaveBeenCalled();
  });

  it('pauses and resumes rotation on demand', () => {
    jest.useFakeTimers();
    const onSlideStart = jest.fn();
    render(
      <SlidingTextCarousel
        texts={['First', 'Second']}
        onSlideStart={onSlideStart}
      />,
    );
    fireEvent.click(
      screen.getByRole('button', {
        name: messages.marketInsightsCarouselPause.message,
      }),
    );
    act(() => jest.advanceTimersByTime(10_000));
    expect(onSlideStart).not.toHaveBeenCalled();
    fireEvent.click(
      screen.getByRole('button', {
        name: messages.marketInsightsCarouselResume.message,
      }),
    );
    act(() => jest.advanceTimersByTime(5000));
    expect(onSlideStart).toHaveBeenCalledTimes(1);
  });

  it('shows only the first headline when reduced motion is requested', () => {
    jest.useFakeTimers();
    const matchMedia = jest.spyOn(window, 'matchMedia').mockReturnValue({
      matches: true,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    } as unknown as MediaQueryList);
    try {
      const onSlideStart = jest.fn();
      render(
        <SlidingTextCarousel
          texts={['First', 'Second']}
          onSlideStart={onSlideStart}
        />,
      );
      act(() => jest.advanceTimersByTime(10_000));
      expect(screen.getByText('First')).toBeInTheDocument();
      expect(screen.queryByText('Second')).not.toBeInTheDocument();
      expect(onSlideStart).not.toHaveBeenCalled();
    } finally {
      matchMedia.mockRestore();
    }
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
