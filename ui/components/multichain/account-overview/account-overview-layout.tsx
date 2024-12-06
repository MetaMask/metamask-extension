import React, { useState } from 'react';
import { Carousel } from 'react-responsive-carousel';
import { Box, BannerBase } from '../../component-library';
import {
  AlignItems,
  FontWeight,
  TextAlign,
  TextVariant,
} from '../../../helpers/constants/design-system';
import {
  AccountOverviewTabsProps,
  AccountOverviewTabs,
} from './account-overview-tabs';

export type AccountOverviewLayoutProps = AccountOverviewTabsProps & {
  children: React.ReactElement;
};

const MARGIN_VALUES = {
  BOTTOM: '40px',
  OUTER_EDGE: '4%',
  INNER_EDGE: '2%',
  NONE: '0',
};

const WIDTH_VALUES = {
  SINGLE_SLIDE: '100%',
  MULTIPLE_SLIDES: '96%',
};

const BANNER_STYLES = {
  BACKGROUND_COLOR: '#2E3033',
  BORDER_COLOR: '#858B9A33',
  HEIGHT: '59px',
};

const ACCESSORY_STYLES = {
  BACKGROUND_COLOR: 'red',
  WIDTH: '60px',
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
            totalSlides={slides.length}
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
          showArrows={false}
          onChange={(index: number) => setSelectedIndex(index)}
          showStatus={false}
          autoPlay={false}
          swipeScrollTolerance={5}
          centerSlidePercentage={slides.length === 1 ? 92 : 90}
          axis="horizontal"
          preventMovementUntilSwipeScrollTolerance
          emulateTouch
          centerMode
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
  totalSlides,
  onClose,
}: {
  id: number;
  totalSlides: number;
  onClose: (id: number) => void;
}) {
  const getMargin = () => {
    // Single slide case
    if (totalSlides === 1) {
      return `${MARGIN_VALUES.NONE} ${MARGIN_VALUES.OUTER_EDGE} ${MARGIN_VALUES.BOTTOM} ${MARGIN_VALUES.OUTER_EDGE}`;
    }

    // Two slides case
    if (totalSlides === 2) {
      return id === 0
        ? `${MARGIN_VALUES.NONE} ${MARGIN_VALUES.INNER_EDGE} ${MARGIN_VALUES.BOTTOM} ${MARGIN_VALUES.OUTER_EDGE}` // First slide
        : `${MARGIN_VALUES.NONE} ${MARGIN_VALUES.OUTER_EDGE} ${MARGIN_VALUES.BOTTOM} ${MARGIN_VALUES.INNER_EDGE}`; // Second slide
    }

    // Three or more slides case
    if (id === 0) {
      return `${MARGIN_VALUES.NONE} ${MARGIN_VALUES.NONE} ${MARGIN_VALUES.BOTTOM} ${MARGIN_VALUES.OUTER_EDGE}`; // First slide
    }
    if (id === totalSlides - 1) {
      return `${MARGIN_VALUES.NONE} ${MARGIN_VALUES.OUTER_EDGE} ${MARGIN_VALUES.BOTTOM} ${MARGIN_VALUES.NONE}`; // Last slide
    }
    return `${MARGIN_VALUES.NONE} ${MARGIN_VALUES.INNER_EDGE} ${MARGIN_VALUES.BOTTOM} ${MARGIN_VALUES.INNER_EDGE}`; // Middle slides
  };

  const getWidth = () => {
    return totalSlides === 1
      ? WIDTH_VALUES.SINGLE_SLIDE
      : WIDTH_VALUES.MULTIPLE_SLIDES;
  };

  return (
    <BannerBase
      className="mm-carousel-slide"
      startAccessory={
        <Box
          style={{
            backgroundColor: ACCESSORY_STYLES.BACKGROUND_COLOR,
            height: '100%',
            width: ACCESSORY_STYLES.WIDTH,
          }}
        />
      }
      textAlign={TextAlign.Left}
      alignItems={AlignItems.center}
      title="Lorem ipsum"
      description="Dolor sit amet, consectetur"
      fullHeightAccessory
      titleProps={{
        variant: TextVariant.bodySmMedium,
        fontWeight: FontWeight.Medium,
        marginLeft: 2,
      }}
      descriptionProps={{
        variant: TextVariant.bodyXs,
        fontWeight: FontWeight.Normal,
        marginLeft: 2,
      }}
      onClose={() => onClose(id)}
      style={{
        backgroundColor: BANNER_STYLES.BACKGROUND_COLOR,
        border: `1px solid ${BANNER_STYLES.BORDER_COLOR}`,
        height: BANNER_STYLES.HEIGHT,
        margin: getMargin(),
        width: getWidth(),
      }}
    />
  );
}
