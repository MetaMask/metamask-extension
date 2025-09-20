import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { SolAccountType } from '@metamask/keyring-api';
import {
  CSSTransition as CSSTransitionComponent,
  TransitionGroup,
} from 'react-transition-group';
import { Box, BoxProps } from '../../component-library';
import { getSelectedAccount } from '../../../selectors';
import type { CarouselProps, CarouselState, NavigationAction } from './types';
import { MAX_SLIDES } from './constants';
import { StackCard } from './stack-card';
import { StackCardEmpty } from './stack-card-empty';
import { useTransitionToNextCard } from './animations/useTransitionToNextCard';

export const Carousel = React.forwardRef(
  (
    {
      slides = [],
      isLoading = false,
      onSlideClose,
      onSlideClick,
      onRenderSlides,
      onEmptyState,
      className = '',
      ...props
    }: CarouselProps,
    ref: React.Ref<HTMLDivElement>,
  ) => {
    const [state, setState] = useState<CarouselState>({
      activeSlideIndex: 0,
      isTransitioning: false,
      hasTriggeredEmptyState: false,
    });

    const selectedAccount = useSelector(getSelectedAccount);

    // Filter visible slides
    const visibleSlides = slides
      .filter((slide) => {
        if (
          slide.variableName === 'solana' &&
          selectedAccount?.type === SolAccountType.DataAccount
        ) {
          return false;
        }
        // All cards are dismissable in this implementation - ignore undismissable property
        return !slide.dismissed;
      })
      .slice(0, MAX_SLIDES);

    const currentSlide = visibleSlides[state.activeSlideIndex];
    const nextSlide = visibleSlides[state.activeSlideIndex + 1];
    const isLastCard = visibleSlides.length === 1 && Boolean(currentSlide);

    // Use transition hook for next card logic
    const { transitionToNextCard } = useTransitionToNextCard({
      onSlideRemove: (slideId: string, isLastSlide: boolean) => {
        if (onSlideClose) {
          onSlideClose(slideId, isLastSlide);
        }
      },
      isTransitioning: state.isTransitioning,
      setIsTransitioning: (transitioning: boolean) => {
        setState((prev) => ({ ...prev, isTransitioning: transitioning }));
      },
    });

    // Handle slide array changes
    useEffect(() => {
      if (
        visibleSlides.length > 0 &&
        state.activeSlideIndex >= visibleSlides.length
      ) {
        setState((prev) => ({
          ...prev,
          activeSlideIndex: 0,
        }));
      }

      // Reset empty state trigger flag when new slides are available
      if (visibleSlides.length > 0 && state.hasTriggeredEmptyState) {
        setState((prev) => ({
          ...prev,
          hasTriggeredEmptyState: false,
        }));
      }
    }, [
      visibleSlides.length,
      state.activeSlideIndex,
      state.hasTriggeredEmptyState,
    ]);

    // Render slides callback
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

    const handleSlideClose = (slideId: string, isLastSlide: boolean) => {
      transitionToNextCard(slideId, isLastSlide);
    };

    const handleSlideClick = (
      slideId: string,
      navigation?: NavigationAction,
    ) => {
      if (state.isTransitioning) {
        return;
      }
      onSlideClick?.(slideId, navigation);
    };

    // Loading state
    if (isLoading) {
      return (
        <Box
          className={`carousel-container ${className}`}
          ref={ref}
          {...(props as BoxProps<'div'>)}
        >
          <div className="carousel-cards-wrapper">
            {[...Array(3)].map((_, index) => (
              <div
                key={`skeleton-${index}`}
                className="carousel-card carousel-card--current"
                style={{
                  backgroundColor: 'var(--color-background-muted)',
                  animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                }}
              />
            ))}
          </div>
        </Box>
      );
    }

    // When no slides, show empty state as current card (but only trigger fold once)
    if (visibleSlides.length === 0) {
      return (
        <Box
          className={`carousel-container ${className}`}
          ref={ref}
          {...(props as BoxProps<'div'>)}
        >
          <div className="carousel-cards-wrapper">
            <TransitionGroup>
              <CSSTransitionComponent
                key="empty-state-as-current"
                timeout={300}
                classNames="card"
                appear={true}
                onEntered={() => {
                  // Only trigger empty state once
                  if (state.hasTriggeredEmptyState) {
                    return;
                  }

                  setState((prev) => ({
                    ...prev,
                    hasTriggeredEmptyState: true,
                  }));
                  setTimeout(() => {
                    if (onEmptyState) {
                      onEmptyState();
                    }
                  }, 1000); // Exactly 1 second after empty state card is fully visible
                }}
              >
                <StackCardEmpty isBackground={false} />
              </CSSTransitionComponent>
            </TransitionGroup>
          </div>
        </Box>
      );
    }

    return (
      <Box
        className={`carousel-container ${className}`}
        ref={ref}
        {...(props as BoxProps<'div'>)}
      >
        <div className="carousel-cards-wrapper">
          <TransitionGroup>
            {/* Next card (behind) */}
            {nextSlide && (
              <CSSTransitionComponent
                key={`next-${nextSlide.id}`}
                timeout={250}
                classNames="next-card"
              >
                <StackCard
                  slide={nextSlide}
                  isCurrentCard={false}
                  isLastSlide={false}
                  onSlideClick={handleSlideClick}
                  onTransitionToNextCard={handleSlideClose}
                />
              </CSSTransitionComponent>
            )}

            {/* Empty state (behind last card) */}
            {isLastCard && (
              <CSSTransitionComponent
                key="empty-state-bg"
                timeout={250}
                classNames="next-card"
              >
                <StackCardEmpty isBackground={true} />
              </CSSTransitionComponent>
            )}

            {/* Current card (top) */}
            {currentSlide && (
              <CSSTransitionComponent
                key={`current-${currentSlide.id}`}
                timeout={300}
                classNames="card"
              >
                <StackCard
                  slide={currentSlide}
                  isCurrentCard={true}
                  isLastSlide={isLastCard}
                  onSlideClick={handleSlideClick}
                  onTransitionToNextCard={handleSlideClose}
                />
              </CSSTransitionComponent>
            )}
          </TransitionGroup>
        </div>
      </Box>
    );
  },
);
