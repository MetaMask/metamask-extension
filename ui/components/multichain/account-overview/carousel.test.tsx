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
import { CarouselWithEmptyState } from '../carousel';
import { useDispatch } from '../../../store/hooks';
import { Carousel } from './carousel';

jest.mock('../../../store/hooks', () => ({
  useDispatch: jest.fn(),
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

jest.mock('../../../hooks/useAnalytics', () => {
  const { createEventBuilder } = jest.requireActual(
    '../../../../shared/lib/analytics/create-event-builder',
  );

  return {
    useAnalytics: () => ({
      trackEvent: mockTrackEvent,
      createEventBuilder,
    }),
  };
});

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

const renderCarousel = () => render(<Carousel />);

describe('AccountOverview Carousel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(useDispatch).mockReturnValue(jest.fn());
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
      name: MetaMetricsEventName.BannerDismissed,
      properties: {
        category: MetaMetricsEventCategory.Banner,
        // eslint-disable-next-line @typescript-eslint/naming-convention
        banner_name: 'slide-1',
      },
      sensitiveProperties: {},
    });
    expect(mockTrackEvent).not.toHaveBeenCalledWith(
      expect.objectContaining({ name: MetaMetricsEventName.BannerCloseAll }),
    );
  });

  it('tracks Banner Dismissed and Banner Close All when the last slide is dismissed', () => {
    renderCarousel();

    getCarouselProps().onSlideClose?.('slide-2', true);

    expect(mockTrackEvent).toHaveBeenCalledWith({
      name: MetaMetricsEventName.BannerDismissed,
      properties: {
        category: MetaMetricsEventCategory.Banner,
        // eslint-disable-next-line @typescript-eslint/naming-convention
        banner_name: 'slide-2',
      },
      sensitiveProperties: {},
    });
    expect(mockTrackEvent).toHaveBeenCalledWith({
      name: MetaMetricsEventName.BannerCloseAll,
      properties: {
        category: MetaMetricsEventCategory.Banner,
      },
      sensitiveProperties: {},
    });
  });

  it('tracks a Banner Display event when a slide becomes active', () => {
    renderCarousel();

    getCarouselProps().onActiveSlideChange?.(mockSlides[0]);

    expect(mockTrackEvent).toHaveBeenCalledWith({
      name: MetaMetricsEventName.BannerDisplay,
      properties: {
        category: MetaMetricsEventCategory.Banner,
        // eslint-disable-next-line @typescript-eslint/naming-convention
        banner_name: 'slide-1',
      },
      sensitiveProperties: {},
    });
  });
});
