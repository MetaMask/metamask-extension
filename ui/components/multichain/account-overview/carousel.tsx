import React, { useContext, useState, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { removeSlide, setSelectedAccount } from '../../../store/actions';
import { CarouselWithEmptyState } from '../carousel';
import {
  getAppIsLoading,
  getRemoteFeatureFlags,
  hasCreatedSolanaAccount,
} from '../../../selectors';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import {
  MetaMetricsEventName,
  MetaMetricsEventCategory,
} from '../../../../shared/constants/metametrics';
import type { CarouselSlide } from '../../../../shared/constants/app-state';
import { useCarouselManagement } from '../../../hooks/useCarouselManagement';
import { CreateSolanaAccountModal } from '../create-solana-account-modal';
import { getLastSelectedSolanaAccount } from '../../../selectors/multichain';
import DownloadMobileAppModal from '../../app/download-mobile-modal/download-mobile-modal';

export const Carousel = () => {
  const dispatch = useDispatch();
  const isLoading = useSelector(getAppIsLoading);
  const remoteFeatureFlags = useSelector(getRemoteFeatureFlags);
  const isCarouselEnabled = Boolean(
    remoteFeatureFlags && remoteFeatureFlags.carouselBanners,
  );
  const { trackEvent } = useContext(MetaMetricsContext);
  const [displayedSlideIds, setDisplayedSlideIds] = useState<Set<string>>(
    new Set(),
  );

  const [showCreateSolanaAccountModal, setShowCreateSolanaAccountModal] =
    useState(false);
  const hasSolanaAccount = useSelector(hasCreatedSolanaAccount);
  const selectedSolanaAccount = useSelector(getLastSelectedSolanaAccount);

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

    if (key === 'solana') {
      if (hasSolanaAccount && selectedSolanaAccount) {
        dispatch(setSelectedAccount(selectedSolanaAccount.address));
      } else {
        setShowCreateSolanaAccountModal(true);
      }
    }

    if (key === 'downloadMobileApp') {
      setShowDownloadMobileAppModal(true);
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
  };

  const handleRemoveSlide = (slideId: string, isLastSlide: boolean) => {
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
      if (!displayedSlideIds.has(slide.id)) {
        trackEvent({
          event: MetaMetricsEventName.BannerDisplay,
          category: MetaMetricsEventCategory.Banner,
          properties: {
            // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
            // eslint-disable-next-line @typescript-eslint/naming-convention
            banner_name: slide.id,
          },
        });
        setDisplayedSlideIds((prev) => new Set(prev).add(slide.id));
      }
    },
    [displayedSlideIds, trackEvent],
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
      {showCreateSolanaAccountModal && (
        <CreateSolanaAccountModal
          onClose={() => setShowCreateSolanaAccountModal(false)}
        />
      )}
      {showDownloadMobileAppModal && (
        <DownloadMobileAppModal
          onClose={() => setShowDownloadMobileAppModal(false)}
        />
      )}
    </>
  );
};
