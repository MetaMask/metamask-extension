import React, {
  useRef,
  useState,
  useCallback,
  useMemo,
  useEffect,
  useLayoutEffect,
} from 'react';
import { useSelector } from 'react-redux';
import { removeSlide } from '../../../store/actions';
import { useDispatch } from '../../../store/hooks';
import { CarouselWithEmptyState } from '../carousel';
import { getAppIsLoading, getSelectedAccount } from '../../../selectors';
import { getRemoteFeatureFlags } from '../../../../shared/lib/selectors/remote-feature-flags';
import { useAnalytics } from '../../../hooks/useAnalytics';
import {
  MetaMetricsEventName,
  MetaMetricsEventCategory,
} from '../../../../shared/constants/metametrics';
import type { CarouselSlide } from '../../../../shared/constants/app-state';
import { useCarouselManagement } from '../../../hooks/useCarouselManagement';
import DownloadMobileAppModal from '../../app/download-mobile-modal/download-mobile-modal';
import {
  endTrace,
  trace,
  TraceName,
  TraceOperation,
} from '../../../../shared/lib/trace';
import { getVisibleCarouselSlides } from '../carousel/utils';

/**
 * Identifies the traced banner surface. Unlike mobile, whose equivalent trace
 * covers Braze banners, extension slides are served by Contentful.
 */
const BANNER_TRACE_TAGS = {
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Sentry snake_case
  placement_id: 'home_carousel',
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Sentry snake_case
  banner_source: 'contentful',
} as const;

export const Carousel = () => {
  const dispatch = useDispatch();
  const isLoading = useSelector(getAppIsLoading);
  const remoteFeatureFlags = useSelector(getRemoteFeatureFlags);
  const isCarouselEnabled = Boolean(
    remoteFeatureFlags && remoteFeatureFlags.carouselBanners,
  );
  const isContentfulEnabled = Boolean(
    remoteFeatureFlags?.contentfulCarouselEnabled,
  );
  const selectedAccount = useSelector(getSelectedAccount);
  const { trackEvent, createEventBuilder } = useAnalytics();
  const displayedSlideIds = useRef<Set<string>>(new Set());

  const [showDownloadMobileAppModal, setShowDownloadMobileAppModal] =
    useState(false);

  const { slides, fetchStatus } = useCarouselManagement({
    enabled: isCarouselEnabled,
  });
  const visibleSlides = useMemo(
    () => getVisibleCarouselSlides(slides, selectedAccount?.type),
    [selectedAccount?.type, slides],
  );
  const traceIdRef = useRef<string | null>(null);
  const initialSlideIdsRef = useRef<Set<string>>(new Set());
  const traceActivationStartedRef = useRef(false);

  const endBannerTrace = useCallback(
    (data: Record<string, number | string | boolean>) => {
      const id = traceIdRef.current;
      if (!id) {
        return;
      }

      traceIdRef.current = null;
      endTrace({
        name: TraceName.HomeBannerTimeToContent,
        id,
        data,
      });
    },
    [],
  );

  useLayoutEffect(() => {
    const isEnabled = isCarouselEnabled && isContentfulEnabled;
    if (!isEnabled) {
      endBannerTrace({
        ...BANNER_TRACE_TAGS,
        success: false,
        reason: 'unmounted',
      });
      traceActivationStartedRef.current = false;
      return;
    }

    if (traceActivationStartedRef.current) {
      return;
    }

    traceActivationStartedRef.current = true;
    initialSlideIdsRef.current = new Set(
      slides.map(({ id }: CarouselSlide) => id),
    );
    const id = crypto.randomUUID();
    traceIdRef.current = id;
    trace({
      name: TraceName.HomeBannerTimeToContent,
      id,
      op: TraceOperation.BannerPerformance,
      tags: { ...BANNER_TRACE_TAGS },
    });
  }, [endBannerTrace, isCarouselEnabled, isContentfulEnabled, slides]);

  useEffect(
    () => () =>
      endBannerTrace({
        ...BANNER_TRACE_TAGS,
        success: false,
        reason: 'unmounted',
      }),
    [endBannerTrace],
  );

  useEffect(() => {
    if (fetchStatus === 'error') {
      endBannerTrace({
        ...BANNER_TRACE_TAGS,
        success: false,
        source: 'event',
        reason: 'error',
      });
    } else if (fetchStatus === 'settled' && visibleSlides.length === 0) {
      endBannerTrace({
        ...BANNER_TRACE_TAGS,
        success: false,
        source: 'event',
        reason: 'empty',
      });
    }
  }, [endBannerTrace, fetchStatus, visibleSlides.length]);

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

    trackEvent(
      createEventBuilder(MetaMetricsEventName.BannerSelect)
        .addCategory(MetaMetricsEventCategory.Banner)
        .addProperties({
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          banner_name: key,
        })
        .build(),
    );

    return clickHandled;
  };

  const handleRemoveSlide = (slideId: string, isLastSlide: boolean) => {
    trackEvent(
      createEventBuilder(MetaMetricsEventName.BannerDismissed)
        .addCategory(MetaMetricsEventCategory.Banner)
        .addProperties({
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          banner_name: slideId,
        })
        .build(),
    );

    if (isLastSlide) {
      trackEvent(
        createEventBuilder(MetaMetricsEventName.BannerCloseAll)
          .addCategory(MetaMetricsEventCategory.Banner)
          .build(),
      );
    }

    dispatch(removeSlide(slideId));
  };

  const handleActiveSlideChange = useCallback(
    (slide: CarouselSlide) => {
      endBannerTrace({
        ...BANNER_TRACE_TAGS,
        success: true,
        source: initialSlideIdsRef.current.has(slide.id)
          ? 'warm-cache'
          : 'event',
        // eslint-disable-next-line @typescript-eslint/naming-convention -- Sentry snake_case
        banner_name: slide.id,
      });

      if (!displayedSlideIds.current.has(slide.id)) {
        displayedSlideIds.current.add(slide.id);
        trackEvent(
          createEventBuilder(MetaMetricsEventName.BannerDisplay)
            .addCategory(MetaMetricsEventCategory.Banner)
            .addProperties({
              // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
              // eslint-disable-next-line @typescript-eslint/naming-convention
              banner_name: slide.id,
            })
            .build(),
        );
      }
    },
    [createEventBuilder, endBannerTrace, trackEvent],
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
