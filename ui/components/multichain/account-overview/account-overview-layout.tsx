import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { Carousel } from '../../component-library';
import { getSlides } from '../../../ducks/metamask/metamask';
import { removeSlide, updateSlides } from '../../../store/actions';
import useBridging from '../../../hooks/bridge/useBridging';
///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
import { getSwapsDefaultToken } from '../../../selectors';
///: END:ONLY_INCLUDE_IF
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
  const slides = useSelector(getSlides);
  const dispatch = useDispatch();

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

    const defaultSlides = [
      ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
      {
        id: 'bridge',
        title: 'slideBridgeTitle',
        description: 'slideBridgeDescription',
        image: './images/slide-bridge-icon.svg',
        onClick: handleBridgeClick,
      },
      ///: END:ONLY_INCLUDE_IF
      {
        id: 'card',
        title: 'slideDebitCardTitle',
        description: 'slideDebitCardDescription',
        image: './images/slide-card-icon.svg',
        href: 'https://portfolio.metamask.io/card',
      },
      {
        id: 'fund',
        title: 'slideFundWalletTitle',
        description: 'slideFundWalletDescription',
        image: './images/slide-fund-icon.svg',
        href: 'https://portfolio.metamask.io/buy/build-quote',
      },
      {
        id: 'cash',
        title: 'slideCashOutTitle',
        description: 'slideCashOutDescription',
        image: './images/slide-sell-icon.svg',
        href: 'https://portfolio.metamask.io/buy/build-quote',
      },
    ];
    dispatch(updateSlides(defaultSlides));
  }, []);

  const handleRemoveSlide = (id: string) => {
    dispatch(removeSlide(id));
  };

  return (
    <>
      <div className="account-overview__balance-wrapper">{children}</div>
      <Carousel slides={slides} onClose={handleRemoveSlide} />
      <AccountOverviewTabs {...tabsProps}></AccountOverviewTabs>
    </>
  );
};
