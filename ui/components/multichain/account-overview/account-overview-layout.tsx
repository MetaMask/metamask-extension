import React, { useState } from 'react';
import { Slide, Carousel } from '../../component-library';
import {
  AccountOverviewTabsProps,
  AccountOverviewTabs,
} from './account-overview-tabs';

export type AccountOverviewLayoutProps = AccountOverviewTabsProps & {
  children: React.ReactElement;
};

const slide = {
  id: (Math.random() * 1000000).toString(),
  title: 'Lorem ipsum',
  description: 'Dolor sit amet, consectetur',
  image: 'https://via.placeholder.com/150',
};

export const AccountOverviewLayout = ({
  children,
  ...tabsProps
}: AccountOverviewLayoutProps) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [slides, setSlides] = useState<Slide[]>([slide, slide, slide]);

  return (
    <>
      <div className="account-overview__balance-wrapper">{children}</div>
      {slides.length > 0 && (
        <Carousel
          slides={slides}
          selectedItem={selectedIndex}
          onChange={(index: number) => setSelectedIndex(index)}
        />
      )}
      <AccountOverviewTabs {...tabsProps}></AccountOverviewTabs>
    </>
  );
};
