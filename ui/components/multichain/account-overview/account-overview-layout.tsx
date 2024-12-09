import React from 'react';
import { useSelector } from 'react-redux';
import { Carousel } from '../../component-library';
import { getSlides } from '../../../ducks/metamask/metamask';
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

  return (
    <>
      <div className="account-overview__balance-wrapper">{children}</div>
      <Carousel slides={slides} />
      <AccountOverviewTabs {...tabsProps}></AccountOverviewTabs>
    </>
  );
};
