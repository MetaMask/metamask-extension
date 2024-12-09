import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Carousel } from '../../component-library';
import { getSlides } from '../../../ducks/metamask/metamask';
import { removeSlide } from '../../../store/actions';
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
