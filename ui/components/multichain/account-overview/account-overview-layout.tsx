import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
import { useLocation } from 'react-router-dom';
///: END:ONLY_INCLUDE_IF
import { removeSlide, updateSlides } from '../../../store/actions';
///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
import useBridging from '../../../hooks/bridge/useBridging';
///: END:ONLY_INCLUDE_IF
import { Carousel } from '..';
import {
  ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
  getSwapsDefaultToken,
  ///: END:ONLY_INCLUDE_IF
  getSelectedAccountCachedBalance,
  getAppIsLoading,
  getSlides,
} from '../../../selectors';
import {
  AccountOverviewTabsProps,
  AccountOverviewTabs,
} from './account-overview-tabs';
import { FUND_SLIDE, BRIDGE_SLIDE, CARD_SLIDE, CASH_SLIDE } from './constants';

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

  const hasZeroBalance = totalBalance === '0x00';

  ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
  const location = useLocation();
  const { openBridgeExperience } = useBridging();
  const defaultSwapsToken = useSelector(getSwapsDefaultToken);
  ///: END:ONLY_INCLUDE_IF

  useEffect(() => {
    ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
    const handleBridgeClick = () => {
      if (defaultSwapsToken) {
        openBridgeExperience(
          'Home',
          defaultSwapsToken,
          location.pathname.includes('asset') ? '&token=native' : '',
        );
      }
    };
    ///: END:ONLY_INCLUDE_IF

    const fundSlide = {
      ...FUND_SLIDE,
      undismissable: hasZeroBalance,
    };

    const defaultSlides = [
      ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
      {
        ...BRIDGE_SLIDE,
        onClick: handleBridgeClick,
      },
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

  const handleRemoveSlide = (id: string) => {
    // Prevent removing the fund slide if user has no balance
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
        onClose={handleRemoveSlide}
      />
      <AccountOverviewTabs {...tabsProps}></AccountOverviewTabs>
    </>
  );
};
