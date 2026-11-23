import React from 'react';
import { act, render, screen } from '@testing-library/react';
import type { CarouselSlide } from '../../../../../shared/constants/app-state';
import { ANIMATION_TIMINGS } from '../animations/animationTimings';
import { CarouselWithEmptyState } from '../carousel-wrapper';

// Matches the hold in useTransitionToEmpty before the fold starts.
const CAUGHT_UP_HOLD_MS = 100;

jest.mock('../../../../hooks/useI18nContext', () => ({
  useI18nContext: () => (key: string) => key,
}));

jest.mock('../carousel', () => ({
  Carousel: () => <div data-testid="carousel-slides" />,
}));

const slide: CarouselSlide = {
  id: 'slide-1',
  title: 'Fund',
  description: 'Add funds',
  image: 'image.png',
  dismissed: false,
  variableName: 'fund',
};

const dismissedSlide: CarouselSlide = { ...slide, dismissed: true };

describe('CarouselWithEmptyState', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders nothing when there were never any slides', () => {
    const { container } = render(
      <CarouselWithEmptyState slides={[dismissedSlide]} />,
    );

    expect(container.firstChild).toBeNull();
    expect(screen.queryByText('carouselAllCaughtUp')).not.toBeInTheDocument();
  });

  it('holds the caught-up message in the banner slot before collapsing', () => {
    const { rerender } = render(<CarouselWithEmptyState slides={[slide]} />);

    expect(screen.getByTestId('carousel-slides')).toBeInTheDocument();

    rerender(<CarouselWithEmptyState slides={[dismissedSlide]} />);

    expect(screen.queryByTestId('carousel-slides')).not.toBeInTheDocument();
    expect(screen.getByText('carouselAllCaughtUp')).toBeInTheDocument();

    const banner = () =>
      document.querySelector('.carousel-container') as HTMLElement;
    expect(banner()).toHaveStyle({ height: '106px' });

    act(() => {
      jest.advanceTimersByTime(50);
    });
    // Home keeps rendering while the message is up. That must not restart the hold.
    rerender(<CarouselWithEmptyState slides={[dismissedSlide]} />);

    act(() => {
      jest.advanceTimersByTime(CAUGHT_UP_HOLD_MS - 51);
    });

    expect(screen.getByText('carouselAllCaughtUp')).toBeInTheDocument();
    expect(banner()).toHaveStyle({ height: '106px' });

    act(() => {
      jest.advanceTimersByTime(1);
    });

    expect(banner()).toHaveStyle({ height: '0px' });
    expect(screen.getByText('carouselAllCaughtUp')).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(ANIMATION_TIMINGS.EMPTY_STATE_DURATION);
    });

    expect(screen.queryByText('carouselAllCaughtUp')).not.toBeInTheDocument();
    expect(document.querySelector('.carousel-container')).toBeNull();
  });

  it('shows a new slide again after the caught-up message has folded away', () => {
    const { rerender } = render(<CarouselWithEmptyState slides={[slide]} />);

    rerender(<CarouselWithEmptyState slides={[dismissedSlide]} />);

    act(() => {
      jest.advanceTimersByTime(
        CAUGHT_UP_HOLD_MS + ANIMATION_TIMINGS.EMPTY_STATE_DURATION,
      );
    });

    expect(screen.queryByText('carouselAllCaughtUp')).not.toBeInTheDocument();

    rerender(<CarouselWithEmptyState slides={[slide]} />);

    expect(screen.getByTestId('carousel-slides')).toBeInTheDocument();
  });
});
