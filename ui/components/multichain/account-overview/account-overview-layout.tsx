import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { getSlides } from '../../../ducks/metamask/metamask';
import { removeSlide, updateSlides } from '../../../store/actions';
import useBridging from '../../../hooks/bridge/useBridging';
import { Carousel } from '..';
import {
  ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
  getSwapsDefaultToken,
  ///: END:ONLY_INCLUDE_IF
  getSelectedAccountCachedBalance,
  getAppIsLoading,
} from '../../../selectors';
import {
  AccountOverviewTabsProps,
  AccountOverviewTabs,
} from './account-overview-tabs';

export type AccountOverviewLayoutProps = AccountOverviewTabsProps & {
  children: React.ReactElement;
};

// Add these constants at the top of the file, after imports
const FUND_SLIDE = {
  id: 'fund',
  title: 'slideFundWalletTitle',
  description: 'slideFundWalletDescription',
  image: './images/slide-fund-icon.svg',
  href: 'https://portfolio.metamask.io/buy/build-quote',
};

///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
const BRIDGE_SLIDE = {
  id: 'bridge',
  title: 'slideBridgeTitle',
  description: 'slideBridgeDescription',
  image: './images/slide-bridge-icon.svg',
};
///: END:ONLY_INCLUDE_IF

const CARD_SLIDE = {
  id: 'card',
  title: 'slideDebitCardTitle',
  description: 'slideDebitCardDescription',
  image: './images/slide-card-icon.svg',
  href: 'https://portfolio.metamask.io/card',
};

const CASH_SLIDE = {
  id: 'cash',
  title: 'slideCashOutTitle',
  description: 'slideCashOutDescription',
  image: './images/slide-sell-icon.svg',
  href: 'https://portfolio.metamask.io/buy/build-quote',
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
    const handleBridgeClick = () => {
      if (defaultSwapsToken) {
        openBridgeExperience(
          'Home',
          defaultSwapsToken,
          location.pathname.includes('asset') ? '&token=native' : '',
        );
      }
    };

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
