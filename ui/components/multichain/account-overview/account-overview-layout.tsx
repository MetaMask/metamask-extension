import React, { useContext, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';

import {
  showModal,
  removeSlide,
  setAccountDetailsAddress,
  ///: BEGIN:ONLY_INCLUDE_IF(solana)
  setSelectedAccount,
  ///: END:ONLY_INCLUDE_IF
} from '../../../store/actions';
import { Carousel } from '..';
import {
  getAppIsLoading,
  getSelectedAccount,
  getRemoteFeatureFlags,
  ///: BEGIN:ONLY_INCLUDE_IF(solana)
  hasCreatedSolanaAccount,
  ///: END:ONLY_INCLUDE_IF
} from '../../../selectors';
import useBridging from '../../../hooks/bridge/useBridging';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import {
  MetaMetricsEventName,
  MetaMetricsEventCategory,
} from '../../../../shared/constants/metametrics';
import type { CarouselSlide } from '../../../../shared/constants/app-state';
import { SMART_ACCOUNT_UPDATE } from '../../../helpers/constants/routes';
import { TURN_ON_BACKUP_AND_SYNC_MODAL_NAME } from '../../app/modals/identity';
import {
  useCarouselManagement,
  BACKUPANDSYNC_SLIDE,
  SMART_ACCOUNT_UPGRADE_SLIDE,
  BASIC_FUNCTIONALITY_SLIDE,
  ///: BEGIN:ONLY_INCLUDE_IF(solana)
  SOLANA_SLIDE,
  ///: END:ONLY_INCLUDE_IF
  DOWNLOAD_MOBILE_APP_SLIDE,
} from '../../../hooks/useCarouselManagement';
///: BEGIN:ONLY_INCLUDE_IF(solana)
import { CreateSolanaAccountModal } from '../create-solana-account-modal';
import { getLastSelectedSolanaAccount } from '../../../selectors/multichain';
///: END:ONLY_INCLUDE_IF
import { getUseSmartAccount } from '../../../pages/confirmations/selectors/preferences';
import { openBasicFunctionalityModal } from '../../../ducks/app/app';
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
  const trackEvent = useContext(MetaMetricsContext);
  const [hasRendered, setHasRendered] = useState(false);
  const history = useHistory();
  const selectedAccount = useSelector(getSelectedAccount);
  const smartAccountOptIn = useSelector(getUseSmartAccount);

  ///: BEGIN:ONLY_INCLUDE_IF(solana)
  const [showCreateSolanaAccountModal, setShowCreateSolanaAccountModal] =
    useState(false);
  const hasSolanaAccount = useSelector(hasCreatedSolanaAccount);
  const selectedSolanaAccount = useSelector(getLastSelectedSolanaAccount);
  ///: END:ONLY_INCLUDE_IF

  const [showDownloadMobileAppModal, setShowDownloadMobileAppModal] =
    useState(false);

  const { slides } = useCarouselManagement({ enabled: isCarouselEnabled });

  const { openBridgeExperience } = useBridging();

  const handleCarouselClick = (id: string) => {
    if (id === 'bridge') {
      // Handle clicking from the wallet overview page carousel
      openBridgeExperience('Carousel');
    }

    if (id === BASIC_FUNCTIONALITY_SLIDE.id) {
      dispatch(openBasicFunctionalityModal());
    }

    if (id === BACKUPANDSYNC_SLIDE.id) {
      dispatch(showModal({ name: TURN_ON_BACKUP_AND_SYNC_MODAL_NAME }));
    }

    ///: BEGIN:ONLY_INCLUDE_IF(solana)
    if (id === SOLANA_SLIDE.id) {
      if (hasSolanaAccount && selectedSolanaAccount) {
        dispatch(setSelectedAccount(selectedSolanaAccount.address));
      } else {
        setShowCreateSolanaAccountModal(true);
      }
    }
    ///: END:ONLY_INCLUDE_IF

    if (id === SMART_ACCOUNT_UPGRADE_SLIDE.id) {
      if (smartAccountOptIn) {
        dispatch(setAccountDetailsAddress(selectedAccount.address));
      } else {
        history.replace(SMART_ACCOUNT_UPDATE);
      }
    }

    if (id === DOWNLOAD_MOBILE_APP_SLIDE.id) {
      setShowDownloadMobileAppModal(true);
    }

    trackEvent({
      event: MetaMetricsEventName.BannerSelect,
      category: MetaMetricsEventCategory.Banner,
      properties: {
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        banner_name: id,
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
      {
        ///: BEGIN:ONLY_INCLUDE_IF(solana)
        showCreateSolanaAccountModal && (
          <CreateSolanaAccountModal
            onClose={() => setShowCreateSolanaAccountModal(false)}
          />
        )
        ///: END:ONLY_INCLUDE_IF
      }
      {showDownloadMobileAppModal && (
        <DownloadMobileAppModal
          onClose={() => setShowDownloadMobileAppModal(false)}
        />
      )}
    </>
  );
};
