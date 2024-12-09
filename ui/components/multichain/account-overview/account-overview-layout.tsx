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
        id: '1',
        title: 'Ready to bridge?',
        description: 'Dolor sit amet, consectetur',
        image: 'https://via.placeholder.com/150',
      },
      {
        id: '2',
        title: 'Lorem ipsum',
        description: 'Dolor sit amet, consectetur',
        image: 'https://via.placeholder.com/150',
      },
      {
        id: '3',
        title: 'Lorem ipsum',
        description: 'Dolor sit amet, consectetur',
        image: 'https://via.placeholder.com/150',
      },
      {
        id: '4',
        title: 'Lorem ipsum',
        description: 'Dolor sit amet, consectetur',
        image: 'https://via.placeholder.com/150',
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
