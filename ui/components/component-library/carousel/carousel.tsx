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

const MAX_SLIDES = 5;

export const Carousel = React.forwardRef(
  (
    { slides = [], onClose, isLoading = false, ...props }: CarouselProps,
    ref: React.Ref<HTMLDivElement>,
  ) => {
    const [selectedIndex, setSelectedIndex] = useState(0);
    const t = useI18nContext();

    const visibleSlides = slides.slice(0, MAX_SLIDES);

    const handleClose = (e: React.MouseEvent<HTMLElement>, slideId: string) => {
      e.preventDefault();
      e.stopPropagation();

      const currentSlideIndex = visibleSlides.findIndex(
        (slide) => slide.id === slideId,
      );

      let newSelectedIndex = selectedIndex;
      if (
        currentSlideIndex === visibleSlides.length - 1 &&
        visibleSlides.length > 1
      ) {
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
    };

    if (isLoading) {
      return (
        <Box
          className={'mm-carousel'}
          ref={ref}
          {...(props as BoxProps<'div'>)}
        >
          <ResponsiveCarousel
            showArrows={false}
            className="mm-carousel__carousel mm-carousel__loading"
            showStatus={false}
            autoPlay={false}
            swipeScrollTolerance={5}
            centerSlidePercentage={getCenterSlidePercentage(3)}
            axis={'horizontal'}
            preventMovementUntilSwipeScrollTolerance
            emulateTouch
            centerMode
            swipeable={false}
          >
            {[...Array(3)].map((_, index) => (
              <BannerBase
                key={`skeleton-${index}`}
                className="mm-carousel-slide"
                textAlign={TextAlign.Left}
                alignItems={AlignItems.center}
                backgroundColor={BackgroundColor.backgroundAlternative}
                borderColor={BorderColor.infoMuted}
                borderWidth={1}
                style={{
                  height: BANNER_STYLES.HEIGHT,
                  margin: getSlideMargin(index, 3),
                  width: getSlideWidth(3),
                }}
              />
            ))}
          </ResponsiveCarousel>
        </Box>
      );
    }

    if (slides.length === 0) {
      return null;
    }

    return (
      <Box className={'mm-carousel'} ref={ref} {...(props as BoxProps<'div'>)}>
        <ResponsiveCarousel
          selectedItem={selectedIndex}
          showArrows={false}
          onChange={handleChange}
          className="mm-carousel__carousel"
          showStatus={false}
          autoPlay={false}
          swipeScrollTolerance={5}
          centerSlidePercentage={getCenterSlidePercentage(visibleSlides.length)}
          axis={'horizontal'}
          preventMovementUntilSwipeScrollTolerance
          emulateTouch
          centerMode
          swipeable
        >
          {visibleSlides.map((slide, index) => (
            <BannerBase
              onClick={() => {
                if (index !== selectedIndex) {
                  return;
                }
                if (slide.href) {
                  global.platform.openTab({ url: slide.href });
                }
                if (slide.onClick) {
                  slide.onClick();
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
              onClose={
                Boolean(handleClose) && !slide.undismissable
                  ? (e: React.MouseEvent<HTMLElement>) =>
                      handleClose(e, slide.id)
                  : undefined
              }
              closeButtonProps={{
                className: 'mm-carousel-slide__close-button',
              }}
              style={{
                height: BANNER_STYLES.HEIGHT,
                margin: getSlideMargin(index, visibleSlides.length),
                width: getSlideWidth(visibleSlides.length),
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
