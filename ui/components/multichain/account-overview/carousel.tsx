import React, { useContext, useState, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
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
import { SHIELD_PLAN_ROUTE } from '../../../helpers/constants/routes';
import { SHIELD_CAROUSEL_ID } from '../../../../shared/modules/shield';

export const Carousel = () => {
  const dispatch = useDispatch();
  const isLoading = useSelector(getAppIsLoading);
  const remoteFeatureFlags = useSelector(getRemoteFeatureFlags);
  const isCarouselEnabled = Boolean(
    remoteFeatureFlags && remoteFeatureFlags.carouselBanners,
  );
  const trackEvent = useContext(MetaMetricsContext);
  const [hasRendered, setHasRendered] = useState(false);

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

  const navigate = useNavigate();

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

    if (key === SHIELD_CAROUSEL_ID) {
      navigate(SHIELD_PLAN_ROUTE);
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

  const handleRenderSlides = useCallback(
    (renderedSlides: CarouselSlide[]) => {
      if (!hasRendered) {
        for (const slide of renderedSlides) {
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
        setHasRendered(true);
      }
    },
    [hasRendered, trackEvent],
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
        onRenderSlides={handleRenderSlides}
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
