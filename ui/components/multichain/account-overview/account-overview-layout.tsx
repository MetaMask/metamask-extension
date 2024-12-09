import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Carousel } from '../../component-library';
import { getSlides } from '../../../ducks/metamask/metamask';
import { removeSlide, updateSlides } from '../../../store/actions';
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

  useEffect(() => {
    const defaultSlides = [
      {
        id: 'bridge',
        title: 'slideBridgeTitle',
        description: 'slideBridgeDescription',
        image: './images/slide-bridge-icon.svg',
        href: '',
      },
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
  }, [updateSlides]);

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
