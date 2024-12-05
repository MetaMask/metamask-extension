import React, { useState } from 'react';
import { Carousel } from 'react-responsive-carousel';
import { Box } from '../../component-library';
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
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [slides, setSlides] = useState(['slide', 'slide', 'slide']);

  const renderSlide = (name: string, id: number) => {
    switch (name) {
      case 'slide':
        return (
          <CarouselSlide
            id={id}
            key={id}
            onClose={(idToRemove) => {
              setSlides((prevSlides) =>
                prevSlides.filter((_, i) => i !== idToRemove),
              );
              setSelectedIndex(0);
            }}
          />
        );
      default:
        return <div />;
    }
  };

  return (
    <>
      <div className="account-overview__balance-wrapper">{children}</div>
      {slides.length > 0 && (
        <Carousel
          selectedItem={selectedIndex}
          showThumbs={false}
          showStatus={false}
          showArrows={false}
          onChange={(index: number) => setSelectedIndex(index)}
          interval={2e3}
          autoPlay
          swipeable
        >
          {slides.map(renderSlide)}
        </Carousel>
      )}
      <AccountOverviewTabs {...tabsProps}></AccountOverviewTabs>
    </>
  );
};

function CarouselSlide({
  id,
  onClose,
}: {
  id: number;
  onClose: (id: number) => void;
}) {
  return (
    <Box
      style={{
        height: '59px',
        margin: '0 20px 35px 20px',
        backgroundColor: '#2E3033',
        border: '1px solid #858B9A33',
        borderRadius: '8px',
        position: 'relative',
        overflow: 'visible',
        textAlign: 'left',
      }}
    >
      <Box
        style={{
          position: 'absolute',
          backgroundColor: 'red',
          left: '10px',
          top: '-1px',
          zIndex: 2,
          height: 'calc(100% + 2px)',
          width: '60px',
        }}
      />
      <Box
        style={{
          position: 'absolute',
          left: '90px',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          padding: '12px 0',
          justifyContent: 'center',
        }}
      >
        <span
          style={{
            fontSize: '14px',
            fontWeight: '500',
          }}
        >
          Lorem ipsum
        </span>
        <span
          style={{
            fontSize: '12px',
            fontWeight: '400',
          }}
        >
          Dolor sit amet, consectetur
        </span>
      </Box>
      <Box
        onClick={() => onClose(id)}
        style={{
          position: 'absolute',
          top: '12px',
          right: '16px',
          width: '24px',
          height: '24px',
          backgroundColor: 'red',
        }}
      />
    </Box>
  );
}
