import React, { useState, useMemo } from 'react';
import { Carousel } from './carousel';
import { EmptyStateComponent } from './stack-card-empty';
import type { CarouselProps } from './types';

export const CarouselWithEmptyState: React.FC<CarouselProps> = (props) => {
  const [showFoldAnimation, setShowFoldAnimation] = useState(false);
  const [hasCompletedEmptyState, setHasCompletedEmptyState] = useState(false);
  const [hasEverHadSlides, setHasEverHadSlides] = useState(false);

  // Calculate visible slides (non-dismissed) to prevent infinite loop
  const visibleSlidesCount = useMemo(() => {
    return (props.slides || []).filter((slide) => !slide.dismissed).length;
  }, [props.slides]);

  // Track if user has ever seen slides
  React.useEffect(() => {
    if (visibleSlidesCount > 0 && !hasEverHadSlides) {
      setHasEverHadSlides(true);
    }
  }, [visibleSlidesCount, hasEverHadSlides]);

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
  React.useEffect(() => {
    if (visibleSlidesCount > 0 && hasCompletedEmptyState) {
      setHasCompletedEmptyState(false);
    }
  }, [visibleSlidesCount, hasCompletedEmptyState]);

  // Show the fold-up animation when triggered by carousel
  if (showFoldAnimation) {
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
