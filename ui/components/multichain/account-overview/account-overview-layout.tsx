///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
import { isEqual } from 'lodash';
import React, { useContext, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';

///: END:ONLY_INCLUDE_IF
import { Carousel } from '..';
///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
import type { CarouselSlide } from '../../../../shared/constants/app-state';
import {
  MetaMetricsEventName,
  MetaMetricsEventCategory,
} from '../../../../shared/constants/metametrics';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import useBridging from '../../../hooks/bridge/useBridging';
///: END:ONLY_INCLUDE_IF
import { useCarouselManagement } from '../../../hooks/useCarouselManagement';
import {
  getAppIsLoading,
  ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
  getSwapsDefaultToken,
  ///: END:ONLY_INCLUDE_IF
} from '../../../selectors';
import { removeSlide } from '../../../store/actions';
import type {
  AccountOverviewTabsProps} from './account-overview-tabs';
import {
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

  ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
  const defaultSwapsToken = useSelector(getSwapsDefaultToken, isEqual);
  ///: END:ONLY_INCLUDE_IF

  const { slides } = useCarouselManagement();

  ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
  const { openBridgeExperience } = useBridging();
  ///: END:ONLY_INCLUDE_IF

  const handleCarouselClick = (id: string) => {
    ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
    if (id === 'bridge') {
      openBridgeExperience(
        'Carousel',
        defaultSwapsToken,
        location.pathname.includes('asset') ? '&token=native' : '',
      );
    }
    ///: END:ONLY_INCLUDE_IF

    // eslint-disable-next-line @typescript-eslint/no-floating-promises -- TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31878
    trackEvent({
      event: MetaMetricsEventName.BannerSelect,
      category: MetaMetricsEventCategory.Banner,
      properties: {
        banner_name: id,
      },
    });
  };

  const handleRemoveSlide = (isLastSlide: boolean, id: string) => {
    if (isLastSlide) {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises -- TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31878
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
          // eslint-disable-next-line @typescript-eslint/no-floating-promises -- TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31878
          trackEvent({
            event: MetaMetricsEventName.BannerDisplay,
            category: MetaMetricsEventCategory.Banner,
            properties: {
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
    </>
  );
};
