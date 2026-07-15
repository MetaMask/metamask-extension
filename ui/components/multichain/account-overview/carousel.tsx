import React, {
  useContext,
  useRef,
  useState,
  useCallback,
  useMemo,
} from 'react';
import { useSelector } from 'react-redux';
import { removeSlide } from '../../../store/actions';
import { CarouselWithEmptyState } from '../carousel';
import { getAppIsLoading } from '../../../selectors';
import { getRemoteFeatureFlags } from '../../../../shared/lib/selectors/remote-feature-flags';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import {
  MetaMetricsEventName,
  MetaMetricsEventCategory,
} from '../../../../shared/constants/metametrics';
import type { CarouselSlide } from '../../../../shared/constants/app-state';
import { useCarouselManagement } from '../../../hooks/useCarouselManagement';
import DownloadMobileAppModal from '../../app/download-mobile-modal/download-mobile-modal';
import { useAppDispatch } from '../../../store/hooks';

export const Carousel = () => {
  const dispatch = useAppDispatch();
  const isLoading = useSelector(getAppIsLoading);
  const remoteFeatureFlags = useSelector(getRemoteFeatureFlags);
  const isCarouselEnabled = Boolean(
    remoteFeatureFlags && remoteFeatureFlags.carouselBanners,
  );
  const { trackEvent } = useContext(MetaMetricsContext);
  const displayedSlideIds = useRef<Set<string>>(new Set());

  const [showDownloadMobileAppModal, setShowDownloadMobileAppModal] =
    useState(false);

  const { slides } = useCarouselManagement({
    enabled: isCarouselEnabled,
  });

  const slideById = useMemo(() => {
    const m = new Map<string, CarouselSlide>();
    for (const s of slides) {
      m.set(s.id, s);
    }
    return m;
  }, [slides]);

  const handleCarouselClick = (id: string) => {
    const slide = slideById.get(id);
    const key = slide?.variableName ?? id;
    let clickHandled = false;

    if (key === 'downloadMobileApp') {
      setShowDownloadMobileAppModal(true);
      clickHandled = true;
    }

    trackEvent({
      event: MetaMetricsEventName.BannerSelect,
      category: MetaMetricsEventCategory.Banner,
      properties: {
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        banner_name: key,
      },
    });

    return clickHandled;
  };

  const handleRemoveSlide = (slideId: string, isLastSlide: boolean) => {
    trackEvent({
      event: MetaMetricsEventName.BannerDismissed,
      category: MetaMetricsEventCategory.Banner,
      properties: {
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        banner_name: slideId,
      },
    });

    if (isLastSlide) {
      trackEvent({
        event: MetaMetricsEventName.BannerCloseAll,
        category: MetaMetricsEventCategory.Banner,
      });
    }

    dispatch(removeSlide(slideId));
  };

  const handleActiveSlideChange = useCallback(
    (slide: CarouselSlide) => {
      if (!displayedSlideIds.current.has(slide.id)) {
        displayedSlideIds.current.add(slide.id);
        trackEvent({
          event: MetaMetricsEventName.BannerDisplay,
          category: MetaMetricsEventCategory.Banner,
          properties: {
            // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
            // eslint-disable-next-line @typescript-eslint/naming-convention
            banner_name: slide.id,
          },
        });
      }
    },
    [trackEvent],
  );

  if (!isCarouselEnabled) {
    return null;
  }

  return (
    <>
      <CarouselWithEmptyState
        slides={slides}
        isLoading={isLoading}
        onSlideClick={handleCarouselClick}
        onSlideClose={handleRemoveSlide}
        onActiveSlideChange={handleActiveSlideChange}
      />
      {showDownloadMobileAppModal && (
        <DownloadMobileAppModal
          onClose={() => setShowDownloadMobileAppModal(false)}
        />
      )}
    </>
  );
};
