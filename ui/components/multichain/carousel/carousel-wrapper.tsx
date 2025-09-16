import React, { useState } from 'react';
import { Carousel } from './carousel';
import { EmptyStateComponent } from './stack-card-empty';
import type { CarouselProps } from './types';

export const CarouselWithEmptyState: React.FC<CarouselProps> = (props) => {
  const [showFoldAnimation, setShowFoldAnimation] = useState(false);
  const [hasCompletedEmptyState, setHasCompletedEmptyState] = useState(false);

  const handleEmptyState = () => {
    if (!hasCompletedEmptyState && !showFoldAnimation) {
      setShowFoldAnimation(true);
    }
  };

  const handleEmptyStateComplete = () => {
    setShowFoldAnimation(false);
    setHasCompletedEmptyState(true); // Mark as completed to prevent re-triggering
  };

  // Reset when new slides become available
  React.useEffect(() => {
    if ((props.slides?.length || 0) > 0 && hasCompletedEmptyState) {
      setHasCompletedEmptyState(false);
    }
  }, [props.slides?.length, hasCompletedEmptyState]);

  // Show the fold-up animation when triggered by carousel
  if (showFoldAnimation) {
    return <EmptyStateComponent onComplete={handleEmptyStateComplete} />;
  }

  // If empty state was completed, don't show carousel at all
  if (hasCompletedEmptyState) {
    return null;
  }

  // Show carousel with proper empty state callback
  return <Carousel {...props} onEmptyState={handleEmptyState} />;
};
