import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { removeSlide, updateSlides } from '../../../store/actions';
import { Carousel } from '..';
import {
  ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
  getSwapsDefaultToken,
  getMetaMetricsId,
  getParticipateInMetaMetrics,
  getDataCollectionForMarketing,
  ///: END:ONLY_INCLUDE_IF
  getSelectedAccountCachedBalance,
  getAppIsLoading,
  getSlides,
} from '../../../selectors';
///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
import { getPortfolioUrl } from '../../../helpers/utils/portfolio';
///: END:ONLY_INCLUDE_IF
import {
  AccountOverviewTabsProps,
  AccountOverviewTabs,
} from './account-overview-tabs';
import {
  FUND_SLIDE,
  ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
  BRIDGE_SLIDE,
  ///: END:ONLY_INCLUDE_IF
  CARD_SLIDE,
  CASH_SLIDE,
  ZERO_BALANCE,
} from './constants';

export type AccountOverviewLayoutProps = AccountOverviewTabsProps & {
  children: React.ReactElement;
};

export const AccountOverviewLayout = ({
  children,
  ...tabsProps
}: AccountOverviewLayoutProps) => {
  const dispatch = useDispatch();
  const slides = useSelector(getSlides);
  const totalBalance = useSelector(getSelectedAccountCachedBalance);
  const isLoading = useSelector(getAppIsLoading);

  const hasZeroBalance = totalBalance === ZERO_BALANCE;

  ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
  const defaultSwapsToken = useSelector(getSwapsDefaultToken);
  const metaMetricsId = useSelector(getMetaMetricsId);
  const isMetaMetricsEnabled = useSelector(getParticipateInMetaMetrics);
  const isMarketingEnabled = useSelector(getDataCollectionForMarketing);
  ///: END:ONLY_INCLUDE_IF

  useEffect(() => {
    const fundSlide = {
      ...FUND_SLIDE,
      undismissable: hasZeroBalance,
    };

    const defaultSlides = [
      ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
      BRIDGE_SLIDE,
      ///: END:ONLY_INCLUDE_IF
      CARD_SLIDE,
      CASH_SLIDE,
    ];

    if (hasZeroBalance) {
      defaultSlides.unshift(fundSlide);
    } else {
      defaultSlides.splice(2, 0, fundSlide);
    }

    dispatch(updateSlides(defaultSlides));
  }, [hasZeroBalance]);

  ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
  const handleCarouselClick = (id: string) => {
    if (id === 'bridge') {
      const portfolioUrl = getPortfolioUrl(
        'bridge',
        'ext_bridge_prepare_swap_link',
        metaMetricsId,
        isMetaMetricsEnabled,
        isMarketingEnabled,
      );

      global.platform.openTab({
        url: `${portfolioUrl}&token=${defaultSwapsToken}`,
      });
    }
  };
  ///: END:ONLY_INCLUDE_IF

  const handleRemoveSlide = (id: string) => {
    if (id === 'fund' && hasZeroBalance) {
      return;
    }
    dispatch(removeSlide(id));
  };

  return (
    <>
      <div className="account-overview__balance-wrapper">{children}</div>
      <Carousel
        slides={slides}
        isLoading={isLoading}
        ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
        onClick={handleCarouselClick}
        ///: END:ONLY_INCLUDE_IF
        onClose={handleRemoveSlide}
      />
      <AccountOverviewTabs {...tabsProps}></AccountOverviewTabs>
    </>
  );
};
