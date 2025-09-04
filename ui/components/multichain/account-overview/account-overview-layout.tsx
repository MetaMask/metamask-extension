import React, { useContext, useState, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { removeSlide, setSelectedAccount } from '../../../store/actions';
import { Carousel } from '..';
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
import {
  AccountOverviewTabsProps,
  AccountOverviewTabs,
} from './account-overview-tabs';

export type AccountOverviewLayoutProps = AccountOverviewTabsProps & {
  children: React.ReactElement;
};

export const AccountOverviewLayout = ({
  children,
  ...tabsProps
}: AccountOverviewLayoutProps) => {
  const dispatch = useDispatch();
  const isLoading = useSelector(getAppIsLoading);
  const remoteFeatureFlags = useSelector(getRemoteFeatureFlags);
  const isCarouselEnabled = Boolean(remoteFeatureFlags?.carouselBanners);
  const { trackEvent } = useContext(MetaMetricsContext);
  const [hasRendered, setHasRendered] = useState(false);

  const [showCreateSolanaAccountModal, setShowCreateSolanaAccountModal] =
    useState(false);
  const hasSolanaAccount = useSelector(hasCreatedSolanaAccount);
  const selectedSolanaAccount = useSelector(getLastSelectedSolanaAccount);

  const [showDownloadMobileAppModal, setShowDownloadMobileAppModal] =
    useState(false);

  const { slides } = useCarouselManagement({ enabled: isCarouselEnabled });

  const slideById = useMemo(() => {
    const m = new Map<string, CarouselSlide>();
    slides.forEach((s: CarouselSlide) => m.set(s.id, s));
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

  const handleRemoveSlide = (isLastSlide: boolean, id: string) => {
    if (isLastSlide) {
      trackEvent({
        event: MetaMetricsEventName.BannerCloseAll,
        category: MetaMetricsEventCategory.Banner,
      });
    }
    dispatch(removeSlide(id));
  };

  const handleRenderSlides = useCallback(
    (renderedSlides: CarouselSlide[]) => {
      if (!hasRendered) {
        renderedSlides.forEach((slide) => {
          trackEvent({
            event: MetaMetricsEventName.BannerDisplay,
            category: MetaMetricsEventCategory.Banner,
            properties: {
              // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
              // eslint-disable-next-line @typescript-eslint/naming-convention
              banner_name: slide.id,
            },
          });
        });
        setHasRendered(true);
      }
    },
    [hasRendered, trackEvent],
  );

  return (
    <>
      <div className="account-overview__balance-wrapper">{children}</div>

      {isCarouselEnabled && (
        <Carousel
          slides={slides}
          isLoading={isLoading}
          onClick={handleCarouselClick}
          onClose={handleRemoveSlide}
          onRenderSlides={handleRenderSlides}
        />
      )}
      <AccountOverviewTabs {...tabsProps}></AccountOverviewTabs>
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
