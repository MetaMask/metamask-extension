import React, { useState, useEffect, useContext } from 'react';
import { useSelector } from 'react-redux';
import { SolAccountType } from '@metamask/keyring-api';
import { Carousel as ResponsiveCarousel } from 'react-responsive-carousel';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { Box, BoxProps, BannerBase } from '../../component-library';
import {
  TextAlign,
  AlignItems,
  TextVariant,
  BorderRadius,
  TextColor,
  FontWeight,
} from '../../../helpers/constants/design-system';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import { getSelectedAccount } from '../../../selectors';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import type { CarouselProps } from './carousel.types';
import { BANNER_STYLES, MAX_SLIDES } from './constants';
import {
  getCenterSlidePercentage,
  getSlideMargin,
  getSlideWidth,
} from './helpers';

export const Carousel = React.forwardRef(
  (
    {
      slides = [],
      isLoading = false,
      onClose,
      onClick,
      onRenderSlides,
      ...props
    }: CarouselProps,
    ref: React.Ref<HTMLDivElement>,
  ) => {
    const [selectedIndex, setSelectedIndex] = useState(0);
    const t = useI18nContext();
    const { trackEvent } = useContext(MetaMetricsContext);

    const selectedAccount = useSelector(getSelectedAccount);

    const visibleSlides = slides
      .filter((slide) => {
        if (
          slide.variableName === 'solana' &&
          selectedAccount?.type === SolAccountType.DataAccount
        ) {
          return false;
        }

        return !slide.dismissed || slide.undismissable;
      })
      .slice(0, MAX_SLIDES);

    useEffect(() => {
      if (
        visibleSlides &&
        visibleSlides.length > 0 &&
        onRenderSlides &&
        !isLoading
      ) {
        onRenderSlides(visibleSlides);
      }
    }, [visibleSlides, onRenderSlides, isLoading]);

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
        onClose(visibleSlides.length === 1, slideId);
      }
    };

    const handleChange = (index: number) => {
      const previousSlide = visibleSlides[selectedIndex];
      const nextSlide = visibleSlides[index];

      // Only track navigation when there's an actual change
      if (selectedIndex !== index) {
        trackEvent({
          event: MetaMetricsEventName.BannerNavigated,
          category: MetaMetricsEventCategory.Banner,
          properties: {
            // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
            // eslint-disable-next-line @typescript-eslint/naming-convention
            from_banner: previousSlide.id,
            // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
            // eslint-disable-next-line @typescript-eslint/naming-convention
            to_banner: nextSlide.id,
            // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
            // eslint-disable-next-line @typescript-eslint/naming-convention
            from_banner_title: previousSlide.title,
            // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
            // eslint-disable-next-line @typescript-eslint/naming-convention
            to_banner_title: nextSlide.title,
            // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
            // eslint-disable-next-line @typescript-eslint/naming-convention
            navigation_method:
              Math.abs(selectedIndex - index) === 1 ? 'swipe' : 'dot',
          },
        });
      }

      setSelectedIndex(index);
    };

    if (isLoading) {
      return (
        <Box className="mm-carousel" ref={ref} {...(props as BoxProps<'div'>)}>
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
                paddingLeft={0}
                borderRadius={BorderRadius.XL}
                paddingRight={0}
                style={{
                  height: BANNER_STYLES.HEIGHT,
                  margin: getSlideMargin(index, 3),
                  width: getSlideWidth(index, 3),
                }}
              />
            ))}
          </ResponsiveCarousel>
        </Box>
      );
    }

    if (visibleSlides.length === 0) {
      return null;
    }

    return (
      <Box
        className={`mm-carousel ${
          visibleSlides.length === 1 ? 'mm-carousel--single-slide' : ''
        }`}
        ref={ref}
        {...(props as BoxProps<'div'>)}
      >
        <ResponsiveCarousel
          selectedItem={selectedIndex}
          showArrows={false}
          onClickItem={(index) => handleChange(index)}
          onChange={(index) => handleChange(index)}
          className="mm-carousel__carousel"
          showStatus={false}
          autoPlay={false}
          showThumbs={false}
          swipeScrollTolerance={5}
          swipeable={visibleSlides.length > 1}
          centerSlidePercentage={getCenterSlidePercentage(visibleSlides.length)}
          axis="horizontal"
          preventMovementUntilSwipeScrollTolerance
          emulateTouch
          centerMode
        >
          {visibleSlides.map((slide, index) => {
            const isContentfulContent = slide.id.startsWith('contentful-');
            return (
              <BannerBase
                data-testid={`slide-${slide.id}`}
                onClick={() => {
                  if (index !== selectedIndex) {
                    return;
                  }
                  if (slide.href) {
                    global.platform.openTab({ url: slide.href });
                  }
                  onClick?.(slide.id);
                }}
                key={slide.id}
                className="mm-carousel-slide"
                startAccessory={
                  <img
                    className="mm-carousel-slide__accessory"
                    src={slide.image}
                    alt={slide.title}
                  />
                }
                textAlign={TextAlign.Left}
                alignItems={AlignItems.center}
                title={isContentfulContent ? slide.title : t(slide.title)}
                description={
                  isContentfulContent ? slide.description : t(slide.description)
                }
                titleProps={{
                  variant: TextVariant.bodySmMedium,
                  fontWeight: FontWeight.Medium,
                  marginLeft: 1,
                }}
                descriptionProps={{
                  variant: TextVariant.bodyXs,
                  fontWeight: FontWeight.Normal,
                  color: TextColor.textAlternative,
                  marginLeft: 1,
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
                  width: getSlideWidth(index, visibleSlides.length),
                  position: 'relative',
                }}
                padding={0}
                paddingLeft={3}
                paddingRight={3}
                borderRadius={BorderRadius.XL}
              />
            );
          })}
        </ResponsiveCarousel>
      </Box>
    );
  },
);
