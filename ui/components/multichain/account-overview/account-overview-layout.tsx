import React, { useContext, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { isEqual } from 'lodash';
import { useHistory } from 'react-router-dom';

import {
  showModal,
  removeSlide,
  ///: BEGIN:ONLY_INCLUDE_IF(solana)
  setSelectedAccount,
  ///: END:ONLY_INCLUDE_IF
} from '../../../store/actions';
import { Carousel } from '..';
import {
  getAppIsLoading,
  getSwapsDefaultToken,
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
} from '../../../hooks/useCarouselManagement';
///: BEGIN:ONLY_INCLUDE_IF(solana)
import { CreateSolanaAccountModal } from '../create-solana-account-modal';
import { getLastSelectedSolanaAccount } from '../../../selectors/multichain';
///: END:ONLY_INCLUDE_IF
import { openBasicFunctionalityModal } from '../../../ducks/app/app';
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
  const trackEvent = useContext(MetaMetricsContext);
  const [hasRendered, setHasRendered] = useState(false);
  const history = useHistory();

  ///: BEGIN:ONLY_INCLUDE_IF(solana)
  const [showCreateSolanaAccountModal, setShowCreateSolanaAccountModal] =
    useState(false);
  const hasSolanaAccount = useSelector(hasCreatedSolanaAccount);
  const selectedSolanaAccount = useSelector(getLastSelectedSolanaAccount);
  ///: END:ONLY_INCLUDE_IF

  const defaultSwapsToken = useSelector(getSwapsDefaultToken, isEqual);

  const { slides } = useCarouselManagement();

  const { openBridgeExperience } = useBridging();

  const handleCarouselClick = (id: string) => {
    if (id === 'bridge') {
      openBridgeExperience(
        'Carousel',
        defaultSwapsToken,
        location.pathname.includes('asset') ? '&token=native' : '',
      );
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
      history.replace(SMART_ACCOUNT_UPDATE);
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
      <Carousel
        slides={slides}
        isLoading={isLoading}
        onClick={handleCarouselClick}
        onClose={handleRemoveSlide}
        onRenderSlides={handleRenderSlides}
      />
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
    </>
  );
};
