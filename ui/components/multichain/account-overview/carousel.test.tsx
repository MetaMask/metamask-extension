import React from 'react';
import { render } from '@testing-library/react';
import { useSelector } from 'react-redux';
import type { CarouselSlide } from '../../../../shared/constants/app-state';
import {
  MetaMetricsEventName,
  MetaMetricsEventCategory,
} from '../../../../shared/constants/metametrics';
import { getAppIsLoading } from '../../../selectors';
import { getRemoteFeatureFlags } from '../../../../shared/lib/selectors/remote-feature-flags';
import { useCarouselManagement } from '../../../hooks/useCarouselManagement';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import { CarouselWithEmptyState } from '../carousel';
import { useAppDispatch } from '../../../store/hooks';
import { Carousel } from './carousel';

jest.mock('../../../store/hooks', () => ({
  useAppDispatch: jest.fn(),
}));

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useSelector: jest.fn(),
}));

jest.mock('../carousel', () => ({
  CarouselWithEmptyState: jest.fn(() => null),
}));

jest.mock('../../../hooks/useCarouselManagement', () => ({
  useCarouselManagement: jest.fn(),
}));

jest.mock(
  '../../app/download-mobile-modal/download-mobile-modal',
  () => () => null,
);

jest.mock('../../../store/actions', () => ({
  removeSlide: jest.fn((id: string) => ({ type: 'REMOVE_SLIDE', payload: id })),
}));

const mockTrackEvent = jest.fn();
const mockMetaMetricsContext = {
  trackEvent: mockTrackEvent,
  bufferedTrace: jest.fn(),
  bufferedEndTrace: jest.fn(),
  onboardingParentContext: { current: null },
};

const mockSlides: CarouselSlide[] = [
  {
    id: 'slide-1',
    title: 'Slide 1',
    description: 'Description 1',
    image: 'https://example.com/1.png',
    variableName: 'one',
  },
  {
    id: 'slide-2',
    title: 'Slide 2',
    description: 'Description 2',
    image: 'https://example.com/2.png',
    variableName: 'two',
  },
];

const getCarouselProps = () => {
  const { calls } = jest.mocked(CarouselWithEmptyState).mock;
  return calls[calls.length - 1][0];
};

const renderCarousel = () =>
  render(
    <MetaMetricsContext.Provider value={mockMetaMetricsContext}>
      <Carousel />
    </MetaMetricsContext.Provider>,
  );

describe('AccountOverview Carousel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(useAppDispatch).mockReturnValue(jest.fn());
    jest.mocked(useSelector).mockImplementation((selector) => {
      if (selector === getAppIsLoading) {
        return false;
      }
      if (selector === getRemoteFeatureFlags) {
        return { carouselBanners: true };
      }
      return undefined;
    });
    jest.mocked(useCarouselManagement).mockReturnValue({ slides: mockSlides });
  });

  it('tracks a Banner Dismissed event when a slide is dismissed', () => {
    renderCarousel();

    getCarouselProps().onSlideClose?.('slide-1', false);

    expect(mockTrackEvent).toHaveBeenCalledWith({
      event: MetaMetricsEventName.BannerDismissed,
      category: MetaMetricsEventCategory.Banner,
      properties: {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        banner_name: 'slide-1',
      },
    });
    expect(mockTrackEvent).not.toHaveBeenCalledWith(
      expect.objectContaining({ event: MetaMetricsEventName.BannerCloseAll }),
    );
  });

  it('tracks Banner Dismissed and Banner Close All when the last slide is dismissed', () => {
    renderCarousel();

    getCarouselProps().onSlideClose?.('slide-2', true);

    expect(mockTrackEvent).toHaveBeenCalledWith({
      event: MetaMetricsEventName.BannerDismissed,
      category: MetaMetricsEventCategory.Banner,
      properties: {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        banner_name: 'slide-2',
      },
    });
    expect(mockTrackEvent).toHaveBeenCalledWith({
      event: MetaMetricsEventName.BannerCloseAll,
      category: MetaMetricsEventCategory.Banner,
    });
  });

  it('tracks a Banner Display event when a slide becomes active', () => {
    renderCarousel();

    getCarouselProps().onActiveSlideChange?.(mockSlides[0]);

    expect(mockTrackEvent).toHaveBeenCalledWith({
      event: MetaMetricsEventName.BannerDisplay,
      category: MetaMetricsEventCategory.Banner,
      properties: {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        banner_name: 'slide-1',
      },
    });
  });
});
