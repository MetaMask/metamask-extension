import React, { useState, useMemo } from 'react';
import { Carousel } from './carousel';
import { EmptyStateComponent } from './stack-card-empty';
import type { CarouselProps } from './types';

export const CarouselWithEmptyState = (props: CarouselProps) => {
  const [showFoldAnimation, setShowFoldAnimation] = useState(false);
  const [hasCompletedEmptyState, setHasCompletedEmptyState] = useState(false);
  const [hasEverHadSlides, setHasEverHadSlides] = useState(false);

  // Calculate visible slides (non-dismissed) to prevent infinite loop
  const visibleSlidesCount = useMemo(() => {
    return (props.slides || []).filter((slide) => !slide.dismissed).length;
  }, [props.slides]);

  // Track if user has ever seen slides
  if (visibleSlidesCount > 0 && !hasEverHadSlides) {
    setHasEverHadSlides(true);
  }

  const handleEmptyState = () => {
    if (!hasCompletedEmptyState && !showFoldAnimation) {
      setShowFoldAnimation(true);
    }
  };

  const handleEmptyStateComplete = () => {
    setShowFoldAnimation(false);
    setHasCompletedEmptyState(true); // Mark as completed to prevent re-triggering
  };

  // Reset when new visible slides become available (not just any slides)
  if (visibleSlidesCount > 0 && hasCompletedEmptyState) {
    setHasCompletedEmptyState(false);
  }

  // Last slide just left the list. Carousel renders nothing in that case, and
  // its empty-state callback waits out the exit animation — that gap is the
  // banner collapsing, then popping back with "You're all caught up!".
  // Mount the caught-up message in this same render so the slot never drops
  // to zero height before the message is on screen.
  const lastSlideDismissed =
    hasEverHadSlides && visibleSlidesCount === 0 && !hasCompletedEmptyState;

  if (showFoldAnimation || lastSlideDismissed) {
    return <EmptyStateComponent onComplete={handleEmptyStateComplete} />;
  }

  // If empty state was completed and there are no visible slides, don't show carousel at all
  // This prevents infinite loops where dismissed slides cause the carousel to re-appear
  if (hasCompletedEmptyState && visibleSlidesCount === 0) {
    return null;
  }

  // If we never had slides and there are no slides, don't show anything
  if (!hasEverHadSlides && visibleSlidesCount === 0) {
    return null;
  }

  // Show carousel with proper empty state callback
  return <Carousel {...props} onEmptyState={handleEmptyState} />;
};
