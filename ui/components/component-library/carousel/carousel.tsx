import React, { useState } from 'react';
import { Carousel as ResponsiveCarousel } from 'react-responsive-carousel';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { Box, BannerBase } from '..';
import type { BoxProps } from '..';
import {
  TextAlign,
  AlignItems,
  TextVariant,
  FontWeight,
  BackgroundColor,
  BorderColor,
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
  HEIGHT: '59px',
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
      slides = [],
      className,
      onClose,
      ...props
    }: CarouselProps,
    ref: React.Ref<HTMLDivElement>,
  ) => {
    const [selectedIndex, setSelectedIndex] = useState(selectedItem);
    const t = useI18nContext();

    const handleClose = (slideId: string) => {
      const currentSlideIndex = slides.findIndex(
        (slide) => slide.id === slideId,
      );

      let newSelectedIndex = selectedIndex;
      if (currentSlideIndex === slides.length - 1 && slides.length > 1) {
        newSelectedIndex = currentSlideIndex - 1;
      } else if (currentSlideIndex < selectedIndex) {
        newSelectedIndex = selectedIndex - 1;
      }

      setSelectedIndex(newSelectedIndex);

      if (onClose) {
        onClose(slideId);
      }
    };

    const handleChange = (index: number) => {
      setSelectedIndex(index);
      if (onChange) {
        onChange(index);
      }
    };

    if (slides.length === 0) {
      return null;
    }

    return (
      <Box className={'mm-carousel'} ref={ref} {...(props as BoxProps<'div'>)}>
        <ResponsiveCarousel
          selectedItem={selectedIndex}
          showArrows={showArrows}
          onChange={handleChange}
          className="mm-carousel__carousel"
          showStatus={showStatus}
          autoPlay={autoPlay}
          swipeScrollTolerance={swipeScrollTolerance}
          centerSlidePercentage={
            centerSlidePercentage || getCenterSlidePercentage(slides.length)
          }
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
              onClick={() => {
                if (slide.href) {
                  global.platform.openTab({ url: slide.href });
                }
              }}
              key={slide.id}
              className="mm-carousel-slide"
              startAccessory={
                <img
                  className="mm-carousel-slide__accessory"
                  src={slide.image}
                />
              }
              textAlign={TextAlign.Left}
              alignItems={AlignItems.center}
              title={t(slide.title)}
              description={t(slide.description)}
              fullHeightAccessory
              titleProps={{
                variant: TextVariant.bodySmMedium,
                fontWeight: FontWeight.Medium,
                marginLeft: 2,
              }}
              backgroundColor={BackgroundColor.backgroundAlternative}
              borderColor={BorderColor.infoMuted}
              borderWidth={1}
              descriptionProps={{
                variant: TextVariant.bodyXs,
                fontWeight: FontWeight.Normal,
                marginLeft: 2,
              }}
              onClose={handleClose ? () => handleClose(slide.id) : undefined}
              closeButtonProps={{
                className: 'mm-carousel-slide__close-button',
              }}
              style={{
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

function getCenterSlidePercentage(totalSlides: number) {
  return totalSlides === 1 ? 92 : 90;
}
