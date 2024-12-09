import React from 'react';
import classnames from 'classnames';
import { Carousel as ResponsiveCarousel } from 'react-responsive-carousel';
import { Box, BannerBase } from '..';
import type { BoxProps } from '..';
import {
  TextAlign,
  AlignItems,
  TextVariant,
  FontWeight,
} from '../../../helpers/constants/design-system';
import type { CarouselProps } from './carousel.types';

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

export const Carousel = React.forwardRef(
  (
    {
      selectedItem = 0,
      showArrows = false,
      onChange,
      showStatus = false,
      autoPlay = false,
      swipeScrollTolerance = 5,
      centerSlidePercentage,
      axis = 'horizontal',
      preventMovementUntilSwipeScrollTolerance = true,
      emulateTouch = true,
      centerMode = true,
      swipeable = true,
      slides,
      className,
      onClose,
      ...props
    }: CarouselProps,
    ref: React.Ref<HTMLDivElement>,
  ) => {
    return (
      <Box
        className={classnames('mm-carousel', className || '')}
        ref={ref}
        {...(props as BoxProps<'div'>)}
      >
        <ResponsiveCarousel
          selectedItem={selectedItem}
          showArrows={showArrows}
          onChange={onChange}
          showStatus={showStatus}
          autoPlay={autoPlay}
          swipeScrollTolerance={swipeScrollTolerance}
          centerSlidePercentage={centerSlidePercentage}
          axis={axis}
          preventMovementUntilSwipeScrollTolerance={
            preventMovementUntilSwipeScrollTolerance
          }
          emulateTouch={emulateTouch}
          centerMode={centerMode}
          swipeable={swipeable}
        >
          {slides.map((slide, index) => (
            <BannerBase
              key={slide.id}
              className="mm-carousel-slide"
              startAccessory={
                <Box
                  style={{
                    backgroundImage: `url(${slide.image})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    height: '100%',
                    width: ACCESSORY_STYLES.WIDTH,
                  }}
                />
              }
              textAlign={TextAlign.Left}
              alignItems={AlignItems.center}
              title={slide.title}
              description={slide.description}
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
              onClose={onClose ? () => onClose(slide.id) : undefined}
              style={{
                backgroundColor: BANNER_STYLES.BACKGROUND_COLOR,
                border: `1px solid ${BANNER_STYLES.BORDER_COLOR}`,
                height: BANNER_STYLES.HEIGHT,
                margin: getSlideMargin(index, slides.length),
                width: getSlideWidth(slides.length),
              }}
            />
          ))}
        </ResponsiveCarousel>
      </Box>
    );
  },
);

function getSlideMargin(index: number, totalSlides: number) {
  // Single slide case
  if (totalSlides === 1) {
    return `${MARGIN_VALUES.NONE} ${MARGIN_VALUES.OUTER_EDGE} ${MARGIN_VALUES.BOTTOM} ${MARGIN_VALUES.OUTER_EDGE}`;
  }

  // Two slides case
  if (totalSlides === 2) {
    return index === 0
      ? `${MARGIN_VALUES.NONE} ${MARGIN_VALUES.INNER_EDGE} ${MARGIN_VALUES.BOTTOM} ${MARGIN_VALUES.OUTER_EDGE}`
      : `${MARGIN_VALUES.NONE} ${MARGIN_VALUES.OUTER_EDGE} ${MARGIN_VALUES.BOTTOM} ${MARGIN_VALUES.INNER_EDGE}`;
  }

  // Three or more slides case
  if (index === 0) {
    return `${MARGIN_VALUES.NONE} ${MARGIN_VALUES.NONE} ${MARGIN_VALUES.BOTTOM} ${MARGIN_VALUES.OUTER_EDGE}`;
  }
  if (index === totalSlides - 1) {
    return `${MARGIN_VALUES.NONE} ${MARGIN_VALUES.OUTER_EDGE} ${MARGIN_VALUES.BOTTOM} ${MARGIN_VALUES.NONE}`;
  }
  return `${MARGIN_VALUES.NONE} ${MARGIN_VALUES.INNER_EDGE} ${MARGIN_VALUES.BOTTOM} ${MARGIN_VALUES.INNER_EDGE}`;
}

function getSlideWidth(totalSlides: number) {
  return totalSlides === 1
    ? WIDTH_VALUES.SINGLE_SLIDE
    : WIDTH_VALUES.MULTIPLE_SLIDES;
}
