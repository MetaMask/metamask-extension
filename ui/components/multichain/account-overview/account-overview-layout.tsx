import React from 'react';
import { Slide, Carousel } from '../../component-library';
import {
  AccountOverviewTabsProps,
  AccountOverviewTabs,
} from './account-overview-tabs';

export type AccountOverviewLayoutProps = AccountOverviewTabsProps & {
  children: React.ReactElement;
};

const generateSlide = (): Slide => ({
  id: Math.floor(Math.random() * 1000000).toString(),
  title: 'Lorem ipsum',
  description: 'Dolor sit amet, consectetur',
  image: 'https://via.placeholder.com/150',
});

const initialSlides = [generateSlide(), generateSlide(), generateSlide()];

export const AccountOverviewLayout = ({
  children,
  ...tabsProps
}: AccountOverviewLayoutProps) => {
  return (
    <>
      <div className="account-overview__balance-wrapper">{children}</div>
      <Carousel slides={initialSlides} />
      <AccountOverviewTabs {...tabsProps}></AccountOverviewTabs>
    </>
  );
};
